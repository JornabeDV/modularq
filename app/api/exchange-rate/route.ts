import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://monedapi.ar/api/usd/bna', {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      { error: 'Error fetching exchange rate' },
      { status: 500 }
    )
  }
}
