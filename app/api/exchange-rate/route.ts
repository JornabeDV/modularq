import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'bna'

    const endpoint =
      type === 'mayorista'
        ? 'https://monedapi.ar/api/usd/mayorista'
        : 'https://monedapi.ar/api/usd/bna'

    const response = await fetch(endpoint, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(
      {
        ...data,
        origen: type === 'mayorista' ? 'Dólar Mayorista' : 'Dólar BNA',
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return NextResponse.json(
      { error: 'Error fetching exchange rate' },
      { status: 500 }
    )
  }
}
