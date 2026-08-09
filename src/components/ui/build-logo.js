// Build script: Parse logosvg.svg and generate AnimatedLogo.tsx
// Groups paths into phases matching the cinematic loading vision:
// Phase 1: HOME + GRANDMA draws
// Phase 2: MAN enters from LEFT
// Phase 3: HEART / HANDS complete
// Phase 4: LEAVES + FULL LOGO

const fs = require('fs');
const path = require('path');

const svgPath = path.resolve(__dirname, '../../../../../mycontent/logosvg.svg');
const outputPath = path.resolve(__dirname, 'AnimatedLogo.tsx');

const svgContent = fs.readFileSync(svgPath, 'utf8');

// Extract all <path> elements
const pathRegex = /<path\s+fill="([^"]+)"\s+opacity="[^"]+"\s+stroke="[^"]*"\s*\n\td="\n([\s\S]*?)"\s*\/>/g;

const allPaths = [];
let match;
while ((match = pathRegex.exec(svgContent)) !== null) {
  const fill = match[1];
  const d = match[2].replace(/\n\t/g, ' ').replace(/\s+/g, ' ').trim();
  allPaths.push({ fill, d });
}

console.log(`Found ${allPaths.length} paths`);

// Classify paths by their starting coordinates and fill color
// Based on careful analysis of the logo structure:

// Path index mapping (0-based, after parsing):
// 0: #FDFEFE - White background (SKIP)
// 1: #08AE97 - Left body/hand (MAN - caregiver body)
// 2: #04A590 - Right body (GRANDMA body + right hand area)
// 3: #04A590 - Bottom left outer circle arc (HANDS)
// 4: #04A691 - Bottom right outer circle arc (HANDS)
// 5: #06A691 - House roof structure (HOME)
// 6: #07A791 - Outer circle (HOME)
// 7: #04A590 - Right interior detail (GRANDMA torso)
// 8: #06AA94 - Left person head circle (MAN head)
// 9: #FCFDFD - Heart outline (HEART)
// 10: #0BAD96 - Heart inner (HEART)
// 11: #7CAA36 - Leaves 1 (LEAVES)
// 12: #7CAA36 - Leaves 2 + vine (LEAVES)
// 13: #05A590 - Right person head (GRANDMA head)
// 14-17: Window panes (HOME)
// 18: #5EAE8A - Vine connector (LEAVES)
// 19+: Tiny dot paths (SKIP)

const groups = {
  // Phase 1: HOME + GRANDMA
  homeAndGrandma: [],
  // Phase 2: MAN enters from LEFT
  man: [],
  // Phase 3: HEART / HANDS
  heartAndHands: [],
  // Phase 4: LEAVES
  leaves: [],
  // Skip
  skip: [],
};

allPaths.forEach((p, i) => {
  if (i === 0) { groups.skip.push({ ...p, index: i }); return; } // white bg
  if (i === 1) { groups.man.push({ ...p, index: i }); return; } // man body
  if (i === 2) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // grandma body
  if (i === 3) { groups.heartAndHands.push({ ...p, index: i }); return; } // bottom left arc
  if (i === 4) { groups.heartAndHands.push({ ...p, index: i }); return; } // bottom right arc
  if (i === 5) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // house
  if (i === 6) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // outer circle
  if (i === 7) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // grandma torso
  if (i === 8) { groups.man.push({ ...p, index: i }); return; } // man head
  if (i === 9) { groups.heartAndHands.push({ ...p, index: i }); return; } // heart outline
  if (i === 10) { groups.heartAndHands.push({ ...p, index: i }); return; } // heart inner
  if (i === 11) { groups.leaves.push({ ...p, index: i }); return; } // leaves 1
  if (i === 12) { groups.leaves.push({ ...p, index: i }); return; } // leaves 2
  if (i === 13) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // grandma head
  if (i >= 14 && i <= 17) { groups.homeAndGrandma.push({ ...p, index: i }); return; } // windows
  if (i === 18) { groups.leaves.push({ ...p, index: i }); return; } // vine connector
  // remaining tiny paths - skip
  groups.skip.push({ ...p, index: i });
});

console.log('Group sizes:');
console.log('  homeAndGrandma:', groups.homeAndGrandma.length);
console.log('  man:', groups.man.length);
console.log('  heartAndHands:', groups.heartAndHands.length);
console.log('  leaves:', groups.leaves.length);
console.log('  skip:', groups.skip.length);

// Generate the React component
function generatePathJSX(pathObj, strokeColor) {
  const sc = strokeColor || pathObj.fill;
  return `        <motion.path
          d="${pathObj.d}"
          fill="${pathObj.fill}"
          initial={{ pathLength: 0, fillOpacity: 0 }}
          animate={phase}
          stroke="${sc}"
          strokeWidth="3"
        />`;
}

const component = `"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

// Animation variant for drawing paths
const drawVariant: Variants = {
  hidden: { pathLength: 0, fillOpacity: 0 },
  visible: {
    pathLength: 1,
    fillOpacity: 1,
    transition: {
      pathLength: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
      fillOpacity: { delay: 0.8, duration: 0.6, ease: "easeOut" },
    },
  },
};

// Phase 1: HOME + GRANDMA
const homeGrandmaPaths = [
${groups.homeAndGrandma.map(p => `  { d: "${p.d}", fill: "${p.fill}" },`).join('\n')}
];

// Phase 2: MAN (enters from left)
const manPaths = [
${groups.man.map(p => `  { d: "${p.d}", fill: "${p.fill}" },`).join('\n')}
];

// Phase 3: HEART / HANDS
const heartHandsPaths = [
${groups.heartAndHands.map(p => `  { d: "${p.d}", fill: "${p.fill}" },`).join('\n')}
];

// Phase 4: LEAVES
const leavesPaths = [
${groups.leaves.map(p => `  { d: "${p.d}", fill: "${p.fill}" },`).join('\n')}
];

interface AnimatedLogoProps {
  /** 0 = hidden, 1 = homeGrandma, 2 = man, 3 = heartHands, 4 = leaves/full */
  phase: number;
}

export default function AnimatedLogo({ phase }: AnimatedLogoProps) {
  return (
    <svg viewBox="0 0 1353 1163" className="w-full h-full">
      {/* Phase 1: HOME + GRANDMA */}
      <motion.g
        initial="hidden"
        animate={phase >= 1 ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0 },
          },
        }}
      >
        {homeGrandmaPaths.map((p, i) => (
          <motion.path
            key={\`home-\${i}\`}
            d={p.d}
            fill={p.fill}
            stroke={p.fill === "#FDFEFE" || p.fill === "#FCFDFD" ? "#209D8B" : p.fill}
            strokeWidth="3"
            variants={drawVariant}
          />
        ))}
      </motion.g>

      {/* Phase 2: MAN enters from LEFT */}
      <motion.g
        initial={{ x: -120, opacity: 0 }}
        animate={
          phase >= 2
            ? { x: 0, opacity: 1 }
            : { x: -120, opacity: 0 }
        }
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.g
          initial="hidden"
          animate={phase >= 2 ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1, delayChildren: 0 },
            },
          }}
        >
          {manPaths.map((p, i) => (
            <motion.path
              key={\`man-\${i}\`}
              d={p.d}
              fill={p.fill}
              stroke={p.fill}
              strokeWidth="3"
              variants={drawVariant}
            />
          ))}
        </motion.g>
      </motion.g>

      {/* Phase 3: HEART / HANDS */}
      <motion.g
        initial="hidden"
        animate={phase >= 3 ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.12, delayChildren: 0 },
          },
        }}
      >
        {heartHandsPaths.map((p, i) => (
          <motion.path
            key={\`heart-\${i}\`}
            d={p.d}
            fill={p.fill}
            stroke={p.fill === "#FDFEFE" || p.fill === "#FCFDFD" ? "#209D8B" : p.fill}
            strokeWidth="3"
            variants={drawVariant}
          />
        ))}
      </motion.g>

      {/* Phase 4: LEAVES */}
      <motion.g
        initial="hidden"
        animate={phase >= 4 ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.1, delayChildren: 0 },
          },
        }}
      >
        {leavesPaths.map((p, i) => (
          <motion.path
            key={\`leaf-\${i}\`}
            d={p.d}
            fill={p.fill}
            stroke={p.fill}
            strokeWidth="2"
            variants={drawVariant}
          />
        ))}
      </motion.g>
    </svg>
  );
}
`;

fs.writeFileSync(outputPath, component, 'utf8');
console.log(`\nAnimatedLogo.tsx written to ${outputPath}`);
console.log(`File size: ${(component.length / 1024).toFixed(1)} KB`);
