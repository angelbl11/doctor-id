import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import express from 'express';
import path from 'path';
const app = express();
const port = 3000;

// Middleware para parsear el cuerpo de la solicitud como JSON
app.use(express.json());
// Middleware para parsear el cuerpo de la solicitud codificado en URL
app.use(express.urlencoded({ extended: true }));

// Función para obtener los datos de membresía para un idmemb dado
async function obtenerDatosMembresia(idmemb) {
    const myHeaders = {
        "Accept": "*/*",
        "Host": "consulta.vhs.com.mx:81",
        "Connection": "keep-alive"
    };

    const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    try {
        const response = await fetch(`http://consulta.vhs.com.mx:81/galaxia/relumia_web/modules/mod-datos-membresias/datos-membresia.php?idmemb=${idmemb}`, requestOptions);
        const htmlResponse = await response.text();
        const root = parse(htmlResponse);
        const especialidadNode = root.querySelector('strong:contains("ESPECIALIDAD")');
        const folioNode = root.querySelector('strong:contains("FOLIO:")');

        const especialidad = especialidadNode ? especialidadNode.nextElementSibling.text.trim() : 'No disponible';
        const folio = folioNode ? folioNode.nextElementSibling.text.trim() : 'No disponible';

        return { especialidad, folio };
    } catch (error) {
        console.error(`Error al obtener los datos de la membresía para idmemb ${idmemb}:`, error);
        return { especialidad: 'Error', folio: 'Error' };
    }
}

// Ruta para la página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Ruta para manejar el envío del formulario
app.post('/buscar', async (req, res) => {
    const idsMembresia = req.body.ids.split(',').map(id => id.trim());
    const datosPromesas = idsMembresia.map(idmemb => obtenerDatosMembresia(idmemb));
    const datos = await Promise.all(datosPromesas);
    res.json(datos);
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
