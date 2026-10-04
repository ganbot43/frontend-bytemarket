/**
 * Icono para una categoría, deducido de su nombre.
 *
 * Las categorías no tienen campo de icono y muchas no tienen banner
 * cargado. Antes se pintaban las dos primeras iniciales, que con nombres
 * como "Pantallas y Displays" daban "PY": la inicial de la conjunción.
 *
 * Se busca por palabra clave sobre el nombre normalizado, así que
 * funciona igual con "Baterías", "baterias" o "Batería y Cargadores".
 */

type Icono = {
  /** Trazos del SVG, en lienzo de 24×24. */
  paths: string[]
  label: string
}

const GENERICO: Icono = {
  label: 'Repuestos',
  paths: [
    'M20.5 7.5 12 3 3.5 7.5v9L12 21l8.5-4.5z',
    'M3.5 7.5 12 12l8.5-4.5M12 12v9',
  ],
}

/* El orden importa: gana la primera que coincida, así que los términos
   más específicos van antes. "Protector de pantalla" debe caer en
   protectores y no en pantallas; "flex de carga" en componentes y no en
   cargadores. */
const REGLAS: Array<{ claves: string[]; icono: Icono }> = [
  {
    claves: ['protector', 'mica', 'vidrio', 'templado', 'carcasa', 'case', 'funda', 'estuche'],
    icono: {
      label: 'Carcasas y protectores',
      paths: [
        'M12 2.5 4.5 5.5v6.2c0 4.5 3.1 8.4 7.5 9.8 4.4-1.4 7.5-5.3 7.5-9.8V5.5z',
        'm9.2 12 2 2 3.6-3.8',
      ],
    },
  },
  {
    claves: ['pantalla', 'display', 'lcd', 'oled', 'tactil', 'táctil', 'touch'],
    icono: {
      label: 'Pantallas',
      paths: [
        'M7 2.5h10a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5z',
        'M10.5 18.5h3',
        'M8 5.5h8v10H8z',
      ],
    },
  },
  {
    claves: ['flex', 'placa', 'chip', 'circuito', 'camara', 'cámara', 'modulo', 'módulo'],
    icono: {
      label: 'Componentes',
      paths: [
        'M8 8h8v8H8z',
        'M5.5 5.5h13v13h-13z',
        'M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3',
      ],
    },
  },
  {
    claves: ['bateria', 'batería', 'pila', 'cargador', 'carga', 'power', 'energia', 'energía'],
    icono: {
      label: 'Baterías y cargadores',
      paths: [
        'M3.5 8.5h13a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14v-4a1.5 1.5 0 0 1 1.5-1.5z',
        'M20.5 11v2',
        'M9.8 10.2 8 12.4h2.6L8.8 14.6',
      ],
    },
  },
  {
    claves: ['cable', 'conector', 'usb', 'puerto', 'adaptador', 'jack'],
    icono: {
      label: 'Cables y conectores',
      paths: [
        'M7 3.5v4a2.5 2.5 0 0 0 2.5 2.5h1A2.5 2.5 0 0 0 13 7.5v-4',
        'M8.8 3.5v2.2M11.2 3.5v2.2',
        'M10 10v4a4 4 0 0 0 4 4h1.5a3 3 0 0 1 0 6',
      ],
    },
  },
  {
    claves: ['audifono', 'audífono', 'auricular', 'parlante', 'altavoz', 'sonido', 'audio'],
    icono: {
      label: 'Audio',
      paths: [
        'M4 14v-2a8 8 0 0 1 16 0v2',
        'M4 14.5A1.5 1.5 0 0 1 5.5 13h1v6h-1A1.5 1.5 0 0 1 4 17.5z',
        'M20 14.5a1.5 1.5 0 0 0-1.5-1.5h-1v6h1a1.5 1.5 0 0 0 1.5-1.5z',
      ],
    },
  },
  {
    claves: ['herramienta', 'kit', 'destornillador', 'reparacion', 'reparación'],
    icono: {
      label: 'Herramientas',
      paths: [
        'M14.7 6.3a3.8 3.8 0 0 1 5 5l-2.2-2.2-2.6.7.7-2.6z',
        'm14.2 9.8-8 8a2 2 0 0 1-2.8-2.8l8-8',
      ],
    },
  },
  {
    claves: ['accesorio', 'soporte', 'holder', 'correa', 'popsocket'],
    icono: {
      label: 'Accesorios',
      paths: [
        'M4.5 7.5h15l-1 12.5h-13z',
        'M9 7.5V6a3 3 0 0 1 6 0v1.5',
      ],
    },
  },
]

/* Sin tildes y en minúscula: el catálogo mezcla "Baterías" y "Baterias"
   según quién cargue el producto. */
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export function useIconoCategoria() {
  function iconoDe(nombre: string): Icono {
    const limpio = normalizar(nombre ?? '')
    for (const regla of REGLAS) {
      if (regla.claves.some((clave) => limpio.includes(normalizar(clave)))) {
        return regla.icono
      }
    }
    return GENERICO
  }

  return { iconoDe }
}
