# Tailormap Viewer with Enhanced Server Launch and QGIS Server Support

This project is a customized version of the Tailormap Viewer, modified to seamlessly launch the following services in a single container:  

- **Tailormap Server**  
- **PostGIS Database**  
- **QGIS Server**

---

## 🚀 Features  

### 1. **Filtering Support for QGIS Server WMS Layers**  
By default, **CQL_FILTER** is not supported by QGIS Server. To overcome this limitation:  

- A custom plugin for QGIS Server has been developed.  
- The plugin intercepts the `<code>CQL_FILTER</code>` parameter and converts it to the QGIS Server `<code>FILTER</code>` syntax.  

<p><strong>📂 Location of the Plugin:</strong></p>  
<p>The plugin resides in the <code>qgisserver_plugins</code> folder and is automatically loaded when the container starts.</p>

---

### 2. **Custom Tailormap Docker Image**  
The official Tailormap image <strong>does not pass <code>CQL_FILTER</code> parameters</strong> if <code>ServerType !== GEOSERVER</code>.  

<p>To address this:</p>  
<ul>
  <li>A custom Tailormap image has been created to pass the <code>CQL_FILTER</code> parameter regardless of the <code>ServerType</code>.</li>
  <li><strong>Steps:</strong></li>
  <ol>
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

## 📂 File and Data Management  

### QGIS Server Data
<p>The <code>qgisserver_data</code> folder is mounted to the QGIS Server container. This means any files placed in this folder will be available within the container.</p>  

<p><strong>Example:</strong></p>
<pre>
https://&lt;your_site&gt;/ows/?MAP=/home/qgisserver/world/world.qgs
</pre>

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

---

## 🛑 Important Note: Internal Communication Limitation  
Internal communication between Docker containers does <strong>not work</strong> for the Tailormap Viewer. Use a reverse proxy to enable communication between the services.

---

### Server configurations:

<p><strong>Apache2:</strong></p>
<pre>
&lt;VirtualHost *:443>
    ServerName &lt;sitename>

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/&lt;sitename>/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/&lt;sitename>/privkey.pem

    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/

    &lt;Location /qgisserver/>
        ProxyPass http://127.0.0.1:8081/
        ProxyPassReverse http://127.0.0.1:8081/
        RequestHeader set Host %{HTTP_HOST}s
        RequestHeader set X-Real-IP %{REMOTE_ADDR}s
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
        RequestHeader set X-Forwarded-Proto https
    &lt;/Location>
&lt;/VirtualHost>

&lt;IfModule mod_proxy.c>
    Listen 6543
    &lt;VirtualHost *:6543>
        ProxyPass / http://localhost:5432/
        ProxyPassReverse / http://localhost:5432/
    &lt;/VirtualHost>
&lt;/IfModule></pre>

<p><strong>Apache2:</strong></p>

<pre>
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
		server_name &lt;yoursite>;
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
    ssl_certificate /etc/letsencrypt/live/&lt;yoursite>/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/&lt;yoursite>/privkey.pem; # managed by Certbot
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
</pre>

Open firewall port for the postgis-server: 
<pre>sudo ufw allow 6543</pre>

<p>Enjoy using your enhanced Tailormap Viewer setup with integrated QGIS Server and PostGIS support! 🎉</p>
