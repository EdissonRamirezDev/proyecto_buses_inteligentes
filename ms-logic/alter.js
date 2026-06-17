const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1053870909',
    database: 'smart_buses_db'
  });

  console.log("Conectado a la base de datos.");
  
  try {
    await connection.execute("ALTER TABLE pqrs MODIFY fotos JSON;");
    console.log("¡Columna 'fotos' modificada a JSON exitosamente!");
  } catch (error) {
    console.error("Error al modificar la columna:", error.message);
  }

  await connection.end();
}

main();
