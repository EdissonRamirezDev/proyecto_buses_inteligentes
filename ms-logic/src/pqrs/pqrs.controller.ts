import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { CreatePqrsDto } from './dto/create-pqrs.dto';
import { UpdatePqrsDto } from './dto/update-pqrs.dto';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Post()
  async create(@Body() createPqrsDto: CreatePqrsDto) {
    // Guardar en DB inicialmente sin radicado
    const pqrs = await this.pqrsService.create(createPqrsDto);
    
    // Llamar a N8N de forma síncrona para que genere el radicado
    let radicado = `PQRS-${pqrs.id.split('-')[0].toUpperCase()}`; // Fallback en caso de error
    try {
      const response = await fetch('https://jhilder.app.n8n.cloud/webhook/pqrs-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pqrs)
      });
      
      if (response.ok) {
        const n8nData = await response.json();
        if (n8nData && n8nData.radicado) {
          radicado = n8nData.radicado;
        }
      }
    } catch (error) {
      console.error('Error contactando a N8N para generar radicado, usando fallback:', error);
    }
    
    // Actualizar con radicado generado por N8N
    await this.pqrsService.update(pqrs.id, { radicado });
    pqrs.radicado = radicado;

    return pqrs;
  }

  @Get()
  findAll() {
    return this.pqrsService.findAll();
  }

  @Get('consulta/:radicado')
  findByRadicado(@Param('radicado') radicado: string) {
    return this.pqrsService.findByRadicado(radicado);
  }

  @Put(':id/estado')
  async updateEstado(@Param('id') id: string, @Body() updatePqrsDto: UpdatePqrsDto) {
    const updated = await this.pqrsService.update(id, updatePqrsDto);
    
    // Webhook 2: Notificar cambios de estado
    try {
      await fetch('https://jhilder.app.n8n.cloud/webhook/pqrs-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (error) {
      console.error('Error notificando cambio de estado a N8N:', error);
    }
    
    return updated;
  }
}
