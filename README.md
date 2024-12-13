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
      <td><code>5432</code></td>
    </tr>
  </tbody>
</table>

<p>To access these services externally, reverse proxy them through a server.</p>

---

## 🛑 Important Note: Internal Communication Limitation  
Internal communication between Docker containers does <strong>not work</strong> for the Tailormap Viewer. Use a reverse proxy to enable communication between the services.

---

<p>Enjoy using your enhanced Tailormap Viewer setup with integrated QGIS Server and PostGIS support! 🎉</p>
