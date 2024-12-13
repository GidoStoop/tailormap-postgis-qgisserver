Copy of Tailormap viewer with changes made to launch the Tailormap server, Postgis database and Qgisserver in one container

Filtering!

Filtering does not work for QGIS server WMS layers. The cause is that CQL_FILTER is not supported by qgisserver, however, I have created a workaround. I created a plugin for QGIS-server that intercepts the CQL_FILTER param and modifies it to fit the QGIS server FILTER synthax. The plugin is found in the folder 'qgisserver_plugins' and is automatically loaded. However, the official tailormap image does not pass the CQL_FILTER parameters if the ServerType != GEOSERVER. Therefore I have created an alternative image that does passes the CQL_FILTER regardless of server type. Simply build the image locally and modify the Docker-compose.yml. 

Want to add more Qgis server plugins? Add them to the 'qgisserver_plugins' folder and recompose the container to load them.

'qgisserver_data' is mounted to the Qgis server image and therefore, any files that are placed in the folder outside of the container will also appear in the container. Example: find your project through https://<your_site>/ows/?MAP=/home/qgisserver/world/world.qgs

In the docker-compose.override.yml the ports are set:
Tailormap is set to localhost:8080
Qgisserver is set to localhost:8081
Postgis database is set to localhost:5432

Reverse proxy these services on a server in order to use them. Docker container internal communication does not work for the Tailormap viewer.
