import { test, expect } from "bun:test"
import { join } from "node:path"
import {
  addPcbKeepoutOverlaysToSvg,
  normalizePcbSvgForSnapshot,
  takeKicadSnapshot,
} from "./take-kicad-snapshot"
import "./png-matcher"

test("normalizePcbSvgForSnapshot remaps both circular and oval drill holes", () => {
  const inputSvg = `
<svg>
  <g style="fill:#000000; fill-opacity:1.0000; stroke:none;">
    <circle cx="5.0000" cy="45.0000" r="1.6000" />
  </g>
  <g style="fill:none;
stroke:#000000; stroke-width:2.0000; stroke-opacity:1;
stroke-linecap:round; stroke-linejoin:round;">
    <path d="M15.0000 4.0000
L15.0000 6.0000" />
  </g>
</svg>
`

  const normalizedSvg = normalizePcbSvgForSnapshot(inputSvg, "pink")

  expect(normalizedSvg).toContain(
    'style="fill:pink; fill-opacity:1.0000; stroke:none;"',
  )
  expect(normalizedSvg).toContain("stroke:pink; stroke-width:2.0000;")
  expect(normalizedSvg).toContain('<circle cx="5.0000" cy="45.0000"')
})

test("addPcbKeepoutOverlaysToSvg draws keepout zone polygons", () => {
  const svg = '<svg viewBox="0 0 20 20"></svg>'
  const kicadPcb = `
(kicad_pcb
  (footprint "Test:Pad"
    (zone_connect 2)
  )
  (gr_line
    (start 95 105)
    (end 105 105)
    (layer Edge.Cuts)
  )
  (gr_line
    (start 105 105)
    (end 105 95)
    (layer Edge.Cuts)
  )
  (zone
    (net 0)
    (net_name "")
    (layer F.Cu)
    (keepout
      (tracks not_allowed)
      (vias not_allowed)
      (pads not_allowed)
      (copperpour not_allowed)
      (footprints not_allowed)
    )
    (polygon
      (pts
        (xy 113.2 102.5)
        (xy 113.2 97.5)
        (xy 110.8 97.5)
        (xy 110.8 102.5)
      )
    )
  )
)
`

  const svgWithOverlay = addPcbKeepoutOverlaysToSvg(svg, kicadPcb)

  expect(svgWithOverlay).toContain('data-cj2k-keepout-overlays="true"')
  expect(svgWithOverlay).toContain("cj2k-keepout-hatch")
  expect(svgWithOverlay).toContain(
    '<polygon points="18.25,7.55 18.25,2.55 15.85,2.55 15.85,7.55" />',
  )
  expect(svgWithOverlay).not.toContain("zone_connect")
})

test("takeKicadSnapshot - schematic export", async () => {
  console.log("Testing KiCad schematic snapshot...")

  const snapshot = await takeKicadSnapshot({
    kicadFilePath: join(
      import.meta.dir,
      "../../kicad-demos/demos/flat_hierarchy/flat_hierarchy.kicad_sch",
    ),
    kicadFileType: "sch",
  })

  // Basic assertions
  expect(snapshot).toBeDefined()
  expect(snapshot.exitCode).toBe(0)
  expect(snapshot.generatedFileContent).toBeDefined()

  // Check that at least one PNG was generated
  const pngFiles = Object.keys(snapshot.generatedFileContent)
  console.log(`Generated ${pngFiles.length} PNG file(s):`, pngFiles)
  expect(pngFiles.length).toBeGreaterThan(0)

  // Test each generated PNG file
  for (const [filename, pngBuffer] of Object.entries(
    snapshot.generatedFileContent,
  )) {
    console.log(`Checking ${filename} (${pngBuffer.length} bytes)`)

    // Verify it's a valid PNG buffer
    expect(pngBuffer).toBeInstanceOf(Buffer)
    expect(pngBuffer.length).toBeGreaterThan(0)

    // Check PNG magic number
    expect(pngBuffer.toString("hex", 0, 8)).toBe("89504e470d0a1a0a")

    // Create snapshot with filename
    const snapshotName = filename.replace(/\//g, "-").replace(".png", "")
    await expect(pngBuffer).toMatchPngSnapshot(import.meta.path, snapshotName)
  }

  console.log("✓ All snapshots match!")
}, 5_500)
