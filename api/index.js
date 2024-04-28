import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
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
        const response = await fetch(`http://consulta.vhs.com.mx:81/galaxia/relumia_web/modules/mod-datos-membresias/datos-membresia.php?idmemb=${idmemb}&idMed=&nombreMed=&valSINO=`, requestOptions);
        const htmlResponse = await response.text();
        const $ = cheerio.load(htmlResponse);
        const especialidad = $('strong').filter((index, element) => $(element).text().trim() === 'ESPECIALIDAD').next().text().trim();
        const folio = $('strong').filter((index, element) => $(element).text().trim() === 'FOLIO:').next().text().trim();

        return { nombre, especialidad, folio };
    } catch (error) {
        console.error(`Error al obtener los datos de la membresía para idmemb ${idmemb}:`, error);
        return null;
    }
}

// Ruta para la página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), '../index.html'));
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
