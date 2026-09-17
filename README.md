# @tscircuit/fabricator-drc

Fabricator-specific DRC checks for tscircuit. Install the provider through the
optional `platform.fabricatorEngine` interface:

```tsx
import { RootCircuit } from "@tscircuit/core"
import { fabricatorEngine } from "@tscircuit/fabricator-drc"

const circuit = new RootCircuit({ platform: { fabricatorEngine } })
circuit.add(
  <board width="10mm" height="10mm" fabricatorPreset="jlcpcb_economy">
    <via name="V1" pcbX={0} pcbY={0} holeDiameter="0.25mm"
      outerDiameter="0.6mm" fromLayer="top" toLayer="bottom" />
  </board>,
)
await circuit.renderUntilSettled()
```

Requires the fabricator engine integration in core and props. The package is
not yet published to npm.

## Initial check

For `jlcpcb_economy`, `jlcpcb_standard`, `jlcpcb_economy_20260912`, and
`jlcpcb_standard_20260912`, via **hole diameters strictly below 0.3 mm** produce
one `pcb_fabricator_extra_charge_warning` per board with all affected via IDs.
Exactly 0.3 mm is allowed without this warning. Outer copper diameter does not
control this check. This records a surcharge warning, not a fabrication error,
and does not change via geometry or calculate a fee.

The spelling is `jlcpcb_economy`, matching the board prop. Unversioned presets
resolve to the 20260912 rules. Dated presets remain fixed; add a new dated
preset before changing rules. Unknown presets currently return no diagnostics.

## Provider contract

`runDrcChecks({ circuitJson, fabricatorPreset, pcbBoardId })`
returns Circuit JSON diagnostic records. Core supplies the selected board's
subtree after routing; callers using the function directly must supply that
same scope. Circuit JSON positions and distances use millimeters in board world
coordinates (+X right, +Y up, +Z above). The function does not mutate its input.

Core inserts the returned records into the circuit. Omitted engines or presets,
`drcChecksDisabled`, and `pcbDisabled` prevent execution. Disabling autorouting
does not disable the check for manually placed vias.

## Development

```sh
bun install
bun test
bun run typecheck
bun run build
bun run format:check
```

Preset rule data and diagnostic generation live in `lib/index.ts`. Add checks
with boundary tests and preserve dated preset behavior. CI validates tests,
types, build output, and formatting; npm publishing is not configured yet.
