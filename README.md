# Tailormap Viewer with QGIS server and PostGIS database

This project is a customized version of the open-source [Tailormap Viewer](https://github.com/Tailormap/tailormap-viewer), developed by [B3Partners](https://www.b3partners.nl/), and is modified to seamlessly launch the following services in a single container:  

- **Tailormap Server**  
- **PostGIS Database**  
- **QGIS Server**

This provides a quick way to host the viewer along with a QGIS Server to serve QGIS project in WMS or WFS, and a PostGIS server to save the layers used in a project to a database. The Tailormap application can then be used to fetch the data from the server and the database to show them in a viewer.

---
## 🐳 Docker Quickstart
<ul>
<li>Save a local copy of this repository on your server.</li>
<li>Modify ports, passwords, custom Tailormap image and other settings in the <code>docker-compose.yml</code> file.</li>
<li>Use the <code>cd</code> to navigate to the local copy of this repo and use <code>sudo docker compose up -d</code>.
<ul><li>On the first build, check the <code>tailormap-server</code> container logs for the admin password for Tailormap.</li></ul>
<li>Install Apache or Nginx and implement the server configurations as described below. Additionally, you can use certbot for getting a https-ssl certificate.</li>
</ul>

---
## 📂 File and Data Management  

### QGIS Server Data
<p>The <code>qgisserver_data</code> folder is mounted to the QGIS Server container. This means any files placed in this folder will be synced to the container and vice versa.</p>  

<p><strong>Example:</strong></p>
<pre>
https://&lt;your_site&gt;/qgisserver/ows/?MAP=/home/qgisserver/world/world.qgs
</pre>

---

## 🧩 QGIS Filter Plugin

### 1. **Filtering Support for QGIS Server WMS Layers**  
By default, **CQL_FILTER** is not supported by QGIS Server, while it is the standard for Geoserver (and used in Tailormap). To overcome this limitation:  

- A [custom plugin for QGIS Server](https://github.com/GidoStoop/cql-filter-to-qgis-filter) has been developed (by me).  
- The plugin intercepts the <code>CQL_FILTER</code> parameter and converts it to the QGIS Server <code>FILTER</code> syntax.  

<p><strong>📂 Location of the Plugin:</strong></p>  

<p>The plugin resides in the <code>qgisserver_plugins</code> folder and is automatically loaded when the container starts. The plugin can also be found in its dedicated repository:

[Link to Github repository](https://github.com/GidoStoop/cql-filter-to-qgis-filter)</p>

---

### 2. **Custom Tailormap Docker Image**  
The official Tailormap image <strong>does not pass <code>CQL_FILTER</code> parameters</strong> if <code>ServerType !== GEOSERVER</code>.  

<p>To address this:</p>  
<ul>
  <li>A custom Tailormap image has been created to pass the <code>CQL_FILTER</code> parameter regardless of the <code>ServerType</code>.</li>
  <li><strong>Steps:</strong></li>
  <ol type="1">
    <li>Build the custom image locally.</li>
    <li>Modify the <code>docker-compose.yml</code> file to use this image.</li>
  </ol>
</ul>

---

## 🔧 Adding QGIS Server Plugins  
<p>Want to add more plugins to your QGIS Server?</p>
<ul>
  <li>Place the plugin files in the <code>qgisserver_plugins</code> folder.</li>
  <li>Recompose the container to automatically load the new plugins.</li>
</ul>

---


## ⚙️ Port Configuration  

<p>In the <code>docker-compose.override.yml</code> file, ports are configured as follows:</p>  

<table>
  <thead>
    <tr>
      <th>Service</th>
      <th>URL</th>
      <th>Port</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Tailormap</strong></td>
      <td><code>http://localhost:8080</code></td>
      <td><code>8080</code></td>
    </tr>
    <tr>
      <td><strong>QGIS Server</strong></td>
      <td><code>http://localhost:8081</code></td>
      <td><code>8081</code></td>
    </tr>
    <tr>
      <td><strong>PostGIS Database</strong></td>
      <td>N/A</td>
      <td><code>6543</code></td>
    </tr>
  </tbody>
</table>

<p>To access these services externally, reverse proxy them through a server.</p>

### 🛑 Important Note: Internal Communication Limitation  
Internal communication between Docker containers does <strong>not work</strong> for the Tailormap Viewer. Use a reverse proxy to enable communication between the services.

---

## 🌐 Server configurations:

<p><strong>Apache2 <code>sites-available/000-default.conf</code>:</strong></p>

```plaintext
<VirtualHost *:443>
    ServerName <sitename>

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/<sitename>/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/<sitename>/privkey.pem
    
    Header always set Content-Security-Policy "upgrade-insecure-requests"
    RequestHeader set X-Forwarded-Proto https

    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/

    <Location /qgisserver/>
        ProxyPass http://127.0.0.1:8081/
        ProxyPassReverse http://127.0.0.1:8081/
        RequestHeader set Host %{HTTP_HOST}s
        RequestHeader set X-Real-IP %{REMOTE_ADDR}s
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
        RequestHeader set X-Forwarded-Proto https
    </Location>
</VirtualHost>

<IfModule mod_proxy.c>
    Listen 6543
    <VirtualHost *:6543>
        ProxyPass / http://localhost:5432/
        ProxyPassReverse / http://localhost:5432/
    ,/VirtualHost>
</IfModule>
```

<p><strong>Nginx: <code>nignx.conf</code></strong></p>

```plaintext
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
	worker_connections 768;
}

http {

	sendfile on;
	tcp_nopush on;
	types_hash_max_size 2048;

	include /etc/nginx/mime.types;
	default_type application/octet-stream;

	ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
	ssl_prefer_server_ciphers on;

	access_log /var/log/nginx/access.log;
	error_log /var/log/nginx/error.log;

	gzip on;

	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;

	server {
		server_name <yoursite>;
		location / {
			proxy_pass http://127.0.0.1:8080/;

		}
	
	location /qgisserver/ {
        proxy_pass http://127.0.0.1:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/<yoursite>/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/<yoursite>/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

	}
}
stream {
    server {
      listen 6543;
    
      proxy_connect_timeout 60s;
      proxy_socket_keepalive on;
      proxy_pass localhost:5432;
    }
}
```

Open firewall port for the postgis-server: 
<pre>sudo ufw allow 6543</pre>


