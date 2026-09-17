import { expect, test } from "bun:test"
import {
  any_circuit_element,
  pcb_via,
  type AnyCircuitElement,
} from "circuit-json"
import { runDrcChecks } from "../lib"

const via = (holeDiameter: number, id: string) =>
  pcb_via.parse({
    type: "pcb_via",
    pcb_via_id: id,
    hole_diameter: holeDiameter,
    outer_diameter: 0.6,
    x: 0,
    y: 0,
    layers: ["top", "bottom"],
  })

test("all four JLCPCB presets warn only for holes strictly below 0.3 mm", () => {
  const circuitJson = [
    via(0.25, "pcb_via_0"),
    via(0.299, "pcb_via_1"),
    via(0.3, "pcb_via_2"),
    via(0.4, "pcb_via_3"),
  ]
  const original = structuredClone(circuitJson)
  for (const fabricatorPreset of [
    "jlcpcb_economy",
    "jlcpcb_standard",
    "jlcpcb_economy_20260912",
    "jlcpcb_standard_20260912",
  ]) {
    const warnings = runDrcChecks({
      circuitJson,
      fabricatorPreset,
      pcbBoardId: "pcb_board_0",
    })
    expect(warnings).toHaveLength(1)
    expect(warnings[0].pcb_via_ids).toEqual(["pcb_via_0", "pcb_via_1"])
    expect(warnings[0].fabricator_preset).toBe(fabricatorPreset)
    expect(warnings[0].pcb_board_id).toBe("pcb_board_0")
    expect(any_circuit_element.parse(warnings[0])).toEqual(warnings[0])
    expect(warnings[0].message).toContain("at least 0.3 mm")
  }
  expect(circuitJson).toEqual(original)
})

test("no warning for an empty board, sufficient holes, or unsupported presets", () => {
  for (const circuitJson of [
    [],
    [via(0.3, "pcb_via_0"), via(0.5, "pcb_via_1")],
  ]) {
    expect(
      runDrcChecks({
        circuitJson,
        fabricatorPreset: "jlcpcb_economy",
        pcbBoardId: "pcb_board_0",
      }),
    ).toEqual([])
  }
  for (const fabricatorPreset of [
    "other_fabricator",
    "jlcpcb_economy_20270101",
    "toString",
    "__proto__",
  ]) {
    expect(
      runDrcChecks({
        circuitJson: [via(0.2, "pcb_via_0")],
        fabricatorPreset,
        pcbBoardId: "pcb_board_0",
      }),
    ).toEqual([])
  }
})

test("newer Circuit JSON records coexist with via checks", () => {
  const circuitJson: AnyCircuitElement[] = [
    { type: "source_bus", source_bus_id: "source_bus_0", source_trace_ids: [] },
    via(0.25, "pcb_via_0"),
  ]
  const original = structuredClone(circuitJson)
  const warnings = runDrcChecks({
    circuitJson,
    fabricatorPreset: "jlcpcb_economy",
    pcbBoardId: "pcb_board_0",
  })
  expect(warnings).toHaveLength(1)
  expect(warnings[0].pcb_via_ids).toEqual(["pcb_via_0"])
  expect(circuitJson).toEqual(original)
})
