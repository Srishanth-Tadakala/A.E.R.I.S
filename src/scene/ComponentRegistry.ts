/**
 * AERIS Component Registry
 * Document ID: AERIS-DOC-003
 * Authoritative shared contract connecting 3D scene objects, raycasting,
 * highlighting, selection, exploded-view kinematics, and HUD dossiers.
 */

export type ComponentId =
  | 'intake_spinner'
  | 'fan_blades'
  | 'lpc_booster'
  | 'hpc_core'
  | 'combustor'
  | 'hpt_turbine'
  | 'lpt_turbine'
  | 'exhaust_nozzle'
  | 'outer_casing';

export interface ComponentMetadata {
  /** Canonical aerospace display name */
  displayName: string;
  /** Sub-assembly category */
  category: 'Cold Section' | 'Core Section' | 'Hot Section' | 'Exhaust' | 'Structural';
  /** Technical specifications (Simulated for visual CAD inspection) */
  specifications: {
    operatingRpm: string;
    temperatureRange: string;
    compressionOrExpansionRatio: string;
    materialAlloy: string;
    stageCount?: number;
    coolingType?: string;
  };
  /** Provenance disclaimer */
  provenance: string;
  /** Description for technical dossier */
  description: string;
}

export interface ComponentRegistryEntry {
  id: ComponentId;
  parentId: ComponentId | null;
  sceneNodeName: string;
  metadata: ComponentMetadata;
  /** Exploded displacement vector [dx, dy, dz] and max travel in world units */
  explodedTransform: {
    direction: [number, number, number];
    maxDistance: number;
  };
  highlightConfig: {
    accentColor: string;
    emissiveIntensity: number;
  };
  isSelectable: boolean;
}

export const COMPONENT_REGISTRY: Record<ComponentId, ComponentRegistryEntry> = {
  intake_spinner: {
    id: 'intake_spinner',
    parentId: null,
    sceneNodeName: 'Node_Intake_Spinner',
    metadata: {
      displayName: 'Inlet Aerodynamic Spinner Cone',
      category: 'Cold Section',
      specifications: {
        operatingRpm: '2,850 RPM (LP Spool)',
        temperatureRange: '-50°C to +40°C',
        compressionOrExpansionRatio: '1.0:1 (Ambient Inlet)',
        materialAlloy: 'Carbon Fiber Composite / Titanium Tip',
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Aerodynamic nose cone engineered to direct incoming supersonic free-stream airflow cleanly into the low-pressure fan root.'
    },
    explodedTransform: {
      direction: [0, 0, 1], // Forward along +Z
      maxDistance: 2.2,
    },
    highlightConfig: {
      accentColor: '#00e5ff',
      emissiveIntensity: 0.6,
    },
    isSelectable: true,
  },
  fan_blades: {
    id: 'fan_blades',
    parentId: null,
    sceneNodeName: 'Node_Fan_Blades',
    metadata: {
      displayName: 'Wide-Chord Titanium Fan Assembly',
      category: 'Cold Section',
      specifications: {
        operatingRpm: '2,850 RPM (LP Spool)',
        temperatureRange: '-45°C to +65°C',
        compressionOrExpansionRatio: '1.65:1 (Fan Pressure Ratio)',
        materialAlloy: 'Superplastic Formed Ti-6Al-4V Alloy',
        stageCount: 1,
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Single-stage, wide-chord swept titanium fan blisk providing 85% of total engine thrust via the cold bypass duct.'
    },
    explodedTransform: {
      direction: [0, 0, 1],
      maxDistance: 1.6,
    },
    highlightConfig: {
      accentColor: '#00e5ff',
      emissiveIntensity: 0.6,
    },
    isSelectable: true,
  },
  lpc_booster: {
    id: 'lpc_booster',
    parentId: null,
    sceneNodeName: 'Node_LPC_Booster',
    metadata: {
      displayName: 'Low-Pressure Compressor (Booster)',
      category: 'Cold Section',
      specifications: {
        operatingRpm: '2,850 RPM (LP Spool)',
        temperatureRange: '+40°C to +180°C',
        compressionOrExpansionRatio: '2.8:1',
        materialAlloy: 'Forged Titanium Ti-8Al-1Mo-1V',
        stageCount: 3,
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: '3-stage axial compressor driven by the low-pressure shaft, pre-compressing primary core air prior to entering the high-pressure core.'
    },
    explodedTransform: {
      direction: [0, 0, 1],
      maxDistance: 1.0,
    },
    highlightConfig: {
      accentColor: '#00e5ff',
      emissiveIntensity: 0.6,
    },
    isSelectable: true,
  },
  hpc_core: {
    id: 'hpc_core',
    parentId: null,
    sceneNodeName: 'Node_HPC_Core',
    metadata: {
      displayName: 'High-Pressure Axial Compressor Core',
      category: 'Core Section',
      specifications: {
        operatingRpm: '11,800 RPM (HP Spool)',
        temperatureRange: '+180°C to +580°C',
        compressionOrExpansionRatio: '14.5:1 (Overall Core 40:1)',
        materialAlloy: 'Nickel-Chromium Inconel 718 / Titanium 6242',
        stageCount: 6,
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: '6-stage axial compressor blisk assembly delivering high-density, high-temperature airflow directly to the annular combustor.'
    },
    explodedTransform: {
      direction: [0, 0, 1],
      maxDistance: 0.4,
    },
    highlightConfig: {
      accentColor: '#ffaa00',
      emissiveIntensity: 0.7,
    },
    isSelectable: true,
  },
  combustor: {
    id: 'combustor',
    parentId: null,
    sceneNodeName: 'Node_Combustor',
    metadata: {
      displayName: 'Annular Low-Emissions Combustor',
      category: 'Hot Section',
      specifications: {
        operatingRpm: 'Stationary Structural Assembly',
        temperatureRange: '+580°C to +1,650°C',
        compressionOrExpansionRatio: '0.96:1 (Pressure Loss)',
        materialAlloy: 'Ceramic Matrix Composite (CMC) / Hastelloy-X',
        coolingType: 'Effusion Cooling Holes + Thermal Barrier Coating (YSZ)',
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Double-walled annular combustion liner featuring 18 lean-burn fuel injector nozzles, withstanding stoichiometric flame temperatures up to 1,650°C.'
    },
    explodedTransform: {
      direction: [0, 0, 0], // Anchor component (does not displace axially)
      maxDistance: 0.0,
    },
    highlightConfig: {
      accentColor: '#ff5500',
      emissiveIntensity: 0.8,
    },
    isSelectable: true,
  },
  hpt_turbine: {
    id: 'hpt_turbine',
    parentId: null,
    sceneNodeName: 'Node_HPT_Turbine',
    metadata: {
      displayName: 'High-Pressure Single-Crystal Turbine',
      category: 'Hot Section',
      specifications: {
        operatingRpm: '11,800 RPM (HP Spool)',
        temperatureRange: '+1,150°C to +1,450°C (Gas Temp)',
        compressionOrExpansionRatio: '1:4.2 (Expansion Ratio)',
        materialAlloy: 'Single-Crystal Nickel Superalloy CMSX-4',
        stageCount: 1,
        coolingType: 'Internal Serpentine Bleed Air Cooling',
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Single-stage high-pressure turbine extracting extreme kinetic energy from combustion gases to drive the 6-stage HPC blisk.'
    },
    explodedTransform: {
      direction: [0, 0, -1], // Aft along -Z
      maxDistance: 0.6,
    },
    highlightConfig: {
      accentColor: '#ff7a00',
      emissiveIntensity: 0.7,
    },
    isSelectable: true,
  },
  lpt_turbine: {
    id: 'lpt_turbine',
    parentId: null,
    sceneNodeName: 'Node_LPT_Turbine',
    metadata: {
      displayName: 'Low-Pressure Multi-Stage Turbine',
      category: 'Hot Section',
      specifications: {
        operatingRpm: '2,850 RPM (LP Spool)',
        temperatureRange: '+650°C to +950°C',
        compressionOrExpansionRatio: '1:6.8 (Expansion Ratio)',
        materialAlloy: 'Waspaloy / Inconel 718 Disks',
        stageCount: 3,
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: '3-stage expanding-diameter low-pressure turbine driving the main front fan and low-pressure booster via the concentric central shaft.'
    },
    explodedTransform: {
      direction: [0, 0, -1],
      maxDistance: 1.3,
    },
    highlightConfig: {
      accentColor: '#ffaa00',
      emissiveIntensity: 0.6,
    },
    isSelectable: true,
  },
  exhaust_nozzle: {
    id: 'exhaust_nozzle',
    parentId: null,
    sceneNodeName: 'Node_Exhaust_Nozzle',
    metadata: {
      displayName: 'Core Exhaust Nozzle & Centerbody Plug',
      category: 'Exhaust',
      specifications: {
        operatingRpm: 'Stationary Aerodynamic Fairing',
        temperatureRange: '+450°C to +600°C',
        compressionOrExpansionRatio: 'Convergent Aerodynamic Nozzle',
        materialAlloy: 'Titanium-Aluminide (TiAl) Composite',
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Convergent aerodynamic core discharge nozzle and centerbody plug cone optimizing residual gas exit velocity to produce core thrust.'
    },
    explodedTransform: {
      direction: [0, 0, -1],
      maxDistance: 2.1,
    },
    highlightConfig: {
      accentColor: '#00e5ff',
      emissiveIntensity: 0.5,
    },
    isSelectable: true,
  },
  outer_casing: {
    id: 'outer_casing',
    parentId: null,
    sceneNodeName: 'Node_Outer_Casing',
    metadata: {
      displayName: 'Acoustic Bypass Nacelle & Split Casing',
      category: 'Structural',
      specifications: {
        operatingRpm: 'Stationary Airframe Structure',
        temperatureRange: '-55°C to +90°C',
        compressionOrExpansionRatio: 'Bypass Ratio 10:1',
        materialAlloy: 'Carbon Fiber Reinforced Polymer (CFRP) Sandwich',
      },
      provenance: 'Procedural CAD Approximation — Parametric Reference Model',
      description: 'Aero-structural split casing featuring sound-absorbing acoustic liners and cutaway visibility to reveal internal rotating turbomachinery.'
    },
    explodedTransform: {
      direction: [0.707, 0.707, 0], // Radially outward (+X, +Y)
      maxDistance: 1.8,
    },
    highlightConfig: {
      accentColor: '#8892b0',
      emissiveIntensity: 0.4,
    },
    isSelectable: true,
  },
};

/**
 * Resolves a Three.js Object3D intersection to its registered ComponentId
 * by traversing up the parent hierarchy looking for userData.componentId.
 */
export function resolveComponentFromObject(object: any): ComponentId | null {
  let current: any = object;
  while (current) {
    if (current.userData && current.userData.componentId) {
      const id = current.userData.componentId as ComponentId;
      if (COMPONENT_REGISTRY[id]) {
        return id;
      }
    }
    current = current.parent;
  }
  return null;
}
