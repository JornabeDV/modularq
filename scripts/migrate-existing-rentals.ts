/**
 * Script de migración para crear RentalModule y RentalContract
 * a partir de proyectos existentes con condition === 'alquiler'.
 *
 * Ejecutar con:
 * npx tsx scripts/migrate-existing-rentals.ts
 */

import { supabase } from '../lib/supabase'

async function migrate() {
  console.log('🔍 Buscando proyectos de alquiler existentes...')

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      description,
      status,
      modulation,
      height,
      width,
      depth,
      module_count,
      client_id,
      delivered_at,
      created_at
    `)
    .eq('condition', 'alquiler')

  if (error) {
    console.error('❌ Error al obtener proyectos:', error)
    process.exit(1)
  }

  if (!projects || projects.length === 0) {
    console.log('ℹ️ No hay proyectos de alquiler para migrar.')
    return
  }

  console.log(`📦 ${projects.length} proyectos de alquiler encontrados.`)

  let modulesCreated = 0
  let contractsCreated = 0

  for (const project of projects) {
    try {
      // Generar código único
      const code = `MOD-${project.id.slice(0, 6).toUpperCase()}`

      // Determinar estado del módulo según estado del proyecto
      const moduleStatus = project.status === 'delivered' ? 'rented' : 'available'

      // Crear RentalModule
      const { data: rentalModule, error: moduleError } = await supabase
        .from('rental_modules')
        .insert({
          code,
          name: project.name,
          description: project.description,
          project_id: project.id,
          modulation: project.modulation || 'standard',
          height: project.height || 2.0,
          width: project.width || 1.5,
          depth: project.depth || 0.8,
          module_count: project.module_count || 1,
          status: moduleStatus,
          created_at: project.created_at,
        })
        .select('*')
        .single()

      if (moduleError) {
        console.error(`❌ Error creando módulo para proyecto ${project.id}:`, moduleError)
        continue
      }

      modulesCreated++
      console.log(`✅ Módulo creado: ${code} -> ${rentalModule.id}`)

      // Si el proyecto fue entregado, crear un contrato inicial
      if (project.status === 'delivered' && project.client_id && project.delivered_at) {
        const { data: contract, error: contractError } = await supabase
          .from('rental_contracts')
          .insert({
            rental_module_id: rentalModule.id,
            client_id: project.client_id,
            start_date: project.delivered_at,
            delivery_date: project.delivered_at,
            monthly_price: 0,
            currency: 'USD',
            status: 'active',
            created_by: project.client_id, // fallback
          })
          .select('*')
          .single()

        if (contractError) {
          console.error(`❌ Error creando contrato para módulo ${rentalModule.id}:`, contractError)
          continue
        }

        // Link current contract
        await supabase
          .from('rental_modules')
          .update({ current_contract_id: contract.id })
          .eq('id', rentalModule.id)

        contractsCreated++
        console.log(`✅ Contrato inicial creado: ${contract.id}`)
      }
    } catch (err) {
      console.error(`❌ Error procesando proyecto ${project.id}:`, err)
    }
  }

  console.log('\n📊 Resumen de migración:')
  console.log(`   Módulos creados: ${modulesCreated}`)
  console.log(`   Contratos creados: ${contractsCreated}`)
  console.log('✅ Migración completada.')
}

migrate().catch((err) => {
  console.error('💥 Error fatal:', err)
  process.exit(1)
})
