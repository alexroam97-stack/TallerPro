import React from 'react';

const damageColors = {
  NONE: 'rgba(255, 255, 255, 0.1)',
  LOW: 'rgba(255, 204, 0, 0.5)',
  MEDIUM: 'rgba(255, 136, 0, 0.6)',
  HIGH: 'rgba(255, 51, 51, 0.7)'
};

const strokeColors = {
  NONE: 'rgba(255, 255, 255, 0.3)',
  LOW: '#ffcc00',
  MEDIUM: '#ff8800',
  HIGH: '#ff3333'
};

const panels = [
  { id: 'front-bumper', d: 'M40,20 Q100,5 160,20 L160,35 L40,35 Z', name: 'Fascia Delantera' },
  { id: 'hood', d: 'M45,35 L155,35 L140,80 L60,80 Z', name: 'Cofre' },
  { id: 'windshield', d: 'M60,80 L140,80 L135,110 L65,110 Z', name: 'Parabrisas' },
  { id: 'roof', d: 'M65,110 L135,110 L135,180 L65,180 Z', name: 'Toldo' },
  { id: 'rear-glass', d: 'M65,180 L135,180 L140,210 L60,210 Z', name: 'Medallón' },
  { id: 'trunk', d: 'M60,210 L140,210 L155,260 L45,260 Z', name: 'Cajuela' },
  { id: 'rear-bumper', d: 'M40,260 L160,260 Q100,275 40,260 Z', name: 'Fascia Trasera' },
  
  // Left Side
  { id: 'front-left-fender', d: 'M40,20 L45,35 L60,80 L40,80 Z', name: 'Salpicadera Izq' },
  { id: 'front-left-door', d: 'M40,80 L65,110 L65,145 L40,145 Z', name: 'Pta Delantera Izq' },
  { id: 'rear-left-door', d: 'M40,145 L65,145 L65,180 L40,180 Z', name: 'Pta Trasera Izq' },
  { id: 'rear-left-fender', d: 'M40,180 L60,210 L45,260 L40,260 Z', name: 'Costado Trasero Izq' },

  // Right Side
  { id: 'front-right-fender', d: 'M160,20 L155,35 L140,80 L160,80 Z', name: 'Salpicadera Der' },
  { id: 'front-right-door', d: 'M160,80 L135,110 L135,145 L160,145 Z', name: 'Pta Delantera Der' },
  { id: 'rear-right-door', d: 'M160,145 L135,145 L135,180 L160,180 Z', name: 'Pta Trasera Der' },
  { id: 'rear-right-fender', d: 'M160,180 L140,210 L155,260 L160,260 Z', name: 'Costado Trasero Der' },
];

export default function InteractiveVehicleSVG({ damagedPanels = [], onChange, readOnly = false }) {
  
  const handlePanelClick = (panelId) => {
    if (readOnly) return;
    const existing = damagedPanels.find(p => p.panelId === panelId);
    let newPanels = [...damagedPanels];

    if (!existing) {
      newPanels.push({ panelId, damageLevel: 'LOW' });
    } else if (existing.damageLevel === 'LOW') {
      existing.damageLevel = 'MEDIUM';
    } else if (existing.damageLevel === 'MEDIUM') {
      existing.damageLevel = 'HIGH';
    } else {
      newPanels = newPanels.filter(p => p.panelId !== panelId);
    }
    onChange(newPanels);
  };

  const getDamageLevel = (panelId) => {
    const p = damagedPanels.find(x => x.panelId === panelId);
    return p ? p.damageLevel : 'NONE';
  };

  return (
    <div className="flex flex-col items-center">
      {!readOnly && (
        <p className="text-xs text-gray-400 mb-4 italic text-center">Toca las piezas para marcar daño:<br/>1 Toque = Leve (Amarillo)<br/>2 Toques = Medio (Naranja)<br/>3 Toques = Grave (Rojo)</p>
      )}
      <svg width="200" height="300" viewBox="0 0 200 300" className="mx-auto select-none">
        {panels.map(panel => {
          const level = getDamageLevel(panel.id);
          return (
            <path
              key={panel.id}
              d={panel.d}
              fill={damageColors[level]}
              stroke={strokeColors[level]}
              strokeWidth="2"
              className={`transition-all duration-300 hover:brightness-125 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              onClick={() => handlePanelClick(panel.id)}
            >
              <title>{panel.name}</title>
            </path>
          );
        })}
      </svg>
      <div className="mt-4 w-full">
        {damagedPanels.length > 0 && (
          <ul className="text-xs space-y-1">
            {damagedPanels.map((p, i) => {
              const name = panels.find(x => x.id === p.panelId)?.name;
              return (
                <li key={i} className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-gray-300">{name}</span>
                  <span className={`font-bold ${p.damageLevel === 'HIGH' ? 'text-red-400' : p.damageLevel === 'MEDIUM' ? 'text-orange-400' : 'text-yellow-400'}`}>
                    {p.damageLevel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
