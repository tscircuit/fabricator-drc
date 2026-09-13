import {
  pcb_fabricator_extra_charge_warning,
  type AnyCircuitElement,
  type PcbBoard,
  type PcbFabricatorExtraChargeWarning,
} from "circuit-json"

export interface FabricatorDrcParams {
  /** Board subtree in Circuit JSON world coordinates: +X right, +Y up, +Z above; positions and distances in mm. */
  circuitJson: AnyCircuitElement[]
  fabricatorPreset: string
  pcbBoardId: PcbBoard["pcb_board_id"]
  subcircuitId: PcbBoard["subcircuit_id"]
}

/** Dated presets keep fixed rules; unversioned names select the current rules. */
export const fabricatorPresets = {
  jlcpcb_economy_20260912: { minimumViaHoleDiameterWithoutExtraCharge: 0.3 },
  jlcpcb_standard_20260912: { minimumViaHoleDiameterWithoutExtraCharge: 0.3 },
} as const

const presetAliases = {
  jlcpcb_economy: "jlcpcb_economy_20260912",
  jlcpcb_standard: "jlcpcb_standard_20260912",
} as const

function resolvePreset(name: string) {
  const resolved = Object.hasOwn(presetAliases, name)
    ? presetAliases[name as keyof typeof presetAliases]
    : name
  return Object.hasOwn(fabricatorPresets, resolved)
    ? fabricatorPresets[resolved as keyof typeof fabricatorPresets]
    : undefined
}

/** Generate surcharge diagnostics without modifying geometry or input records. */
export function runDrcChecks({
  circuitJson,
  fabricatorPreset,
  pcbBoardId,
  subcircuitId,
}: FabricatorDrcParams): PcbFabricatorExtraChargeWarning[] {
  const preset = resolvePreset(fabricatorPreset)
  if (!preset) return []
  const threshold = preset.minimumViaHoleDiameterWithoutExtraCharge
  const smallVias = circuitJson
    .filter((element) => element.type === "pcb_via")
    .filter((via) => via.hole_diameter < threshold)
  if (smallVias.length === 0) return []

  return [
    pcb_fabricator_extra_charge_warning.parse({
      type: "pcb_fabricator_extra_charge_warning",
      fabricator_preset: fabricatorPreset,
      pcb_board_id: pcbBoardId,
      subcircuit_id: subcircuitId,
      pcb_via_ids: smallVias.map((via) => via.pcb_via_id),
      message: `${fabricatorPreset}: ${smallVias.length} via(s) have a hole diameter below ${threshold} mm and incur an extra fabrication charge. Use a hole diameter of at least ${threshold} mm to avoid this charge.`,
    }),
  ]
}

/** Install as platform.fabricatorEngine in @tscircuit/core. */
export const fabricatorEngine = { runDrcChecks }
