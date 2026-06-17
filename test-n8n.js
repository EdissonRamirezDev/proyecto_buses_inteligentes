const payload = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  tipo: "Queja",
  categoria: "Conductor",
  descripcion: "Este es un mensaje de prueba para verificar que N8N procesa y responde con el radicado correctamente.",
  email: "jhildercan@gmail.com",
  estado: "Recibido",
  createdAt: new Date().toISOString()
};

async function testN8n() {
  console.log("Enviando petición a https://jhilder.app.n8n.cloud/webhook/pqrs-new...");
  try {
    const response = await fetch('https://jhilder.app.n8n.cloud/webhook/pqrs-new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Status Code HTTP:", response.status);
    
    const text = await response.text();
    console.log("Respuesta cruda de N8N:", text);
    
  } catch (err) {
    console.error("Error en la petición:", err.message);
  }
}

testN8n();
