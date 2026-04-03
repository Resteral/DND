export const deepMapping = {
  // Reveal Fog logic for a 40x40 grid
  revealedGrid: new Uint8Array(40 * 40).fill(0), // 0: Hidden, 1: Visible, 2: Visited

  processReveals(characters) {
    let changed = false;
    characters.forEach(char => {
      const x = Math.round(char.position[0] + 20); // Center [0,0] to [20,20]
      const z = Math.round(char.position[2] + 20);
      
      this.revealCircle(x, z, 5); // 5 unit sight radius
    });
    return changed;
  },

  revealCircle(cx, cz, radius) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        if (x >= 0 && x < 40 && z >= 0 && z < 40) {
          const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(z - cz, 2));
          if (dist <= radius) {
             const idx = z * 40 + x;
             if (this.revealedGrid[idx] !== 1) {
                this.revealedGrid[idx] = 1;
             }
          }
        }
      }
    }
  },

  getGrid() {
    return this.revealedGrid;
  }
};
