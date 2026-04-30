import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { CircuitJsonToKicadPcbConverter } from "lib/pcb/CircuitJsonToKicadPcbConverter"

test("pcb basics17 copper pour", async () => {
  const circuitJson: CircuitJson = [
    {
      type: "source_net",
      source_net_id: "source_net_1",
      name: "N1",
      member_source_group_ids: [],
      subcircuit_connectivity_map_key: "net1",
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_1",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: "pcb_copper_pour_rect_1",
      layer: "top",
      source_net_id: "source_net_1",
      shape: "rect",
      center: { x: 0, y: 0 },
      width: 15,
      height: 10,
      rotation: 15,
      covered_with_solder_mask: true,
    },
  ]

  const converter = new CircuitJsonToKicadPcbConverter(circuitJson)
  converter.runUntilFinished()

  const outputString = converter.getOutputString()

  expect(outputString).toContain("(zone")
  expect(outputString).toContain("(layer F.Cu)")
})
