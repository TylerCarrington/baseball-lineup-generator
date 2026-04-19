import { Game, Player, RSVPStatus } from '../types';

export function generateLineup(game: Game, players: Player[], settings: any): Record<string, Record<string, string>> {
  const availablePlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
  if (availablePlayers.length < 8) {
    throw new Error("At least 8 players are required to generate a lineup.");
  }

  const fieldPositions = [
    "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
    "Shortstop", "Left Field", "Center Field", "Right Field"
  ];

  const canPlay = (player: Player, pos: string) => {
    if (pos === "Pitcher") return player.positions.includes("Starting Pitcher") || player.positions.includes("Relief Pitcher");
    return player.positions.includes(pos);
  };

  // Calculate position rarity
  const rarity: Record<string, number> = {};
  fieldPositions.forEach(pos => {
    rarity[pos] = availablePlayers.filter(p => canPlay(p, pos)).length;
  });

  // Sort positions by rarity
  const sortedPositions = [...fieldPositions].sort((a, b) => rarity[a] - rarity[b]);

  const lineup: Record<string, Record<string, string>> = {};
  const lockedInnings = game.lockedInnings || [];
  const lockedPositions = game.lockedPositions || [];
  let lastBenched: Set<string> = new Set();
  const previousPitchers: Set<string> = new Set();
  const benchCounts: Record<string, number> = {};
  availablePlayers.forEach(p => benchCounts[p.id] = 0);

  for (let inning = 1; inning <= 6; inning++) {
    const inningKey = inning.toString();
    const isLocked = lockedInnings.includes(inning);
    const assignedThisInning: Set<string> = new Set();

    if (isLocked && game.lineup?.[inningKey]) {
      lineup[inningKey] = { ...game.lineup[inningKey] };
      Object.values(lineup[inningKey]).forEach(playerId => {
        assignedThisInning.add(playerId);
      });
      if (lineup[inningKey]["Pitcher"]) {
        previousPitchers.add(lineup[inningKey]["Pitcher"]);
      }
    } else {
      lineup[inningKey] = {};

      fieldPositions.forEach(pos => {
        if (lockedPositions.includes(pos) && game.lineup?.[inningKey]?.[pos]) {
          const pId = game.lineup[inningKey][pos];
          lineup[inningKey][pos] = pId;
          assignedThisInning.add(pId);
          if (pos === "Pitcher") {
            previousPitchers.add(pId);
          }
        }
      });

      const pickBestCandidate = (candidates: Player[]) => {
        const filteredCandidates = candidates.filter(p => !assignedThisInning.has(p.id));
        if (filteredCandidates.length === 0) return null;
        const maxBench = Math.max(...filteredCandidates.map(p => benchCounts[p.id]));
        const topCandidates = filteredCandidates.filter(p => benchCounts[p.id] === maxBench);
        return topCandidates[Math.floor(Math.random() * topCandidates.length)];
      };

      if (!lineup[inningKey]["Pitcher"]) {
        let pitcherId = "";
        if (inning === 1 || inning === 2) {
          if (inning === 1) {
            const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
            const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
            pitcherId = pickBestCandidate(pool)?.id || pool.filter(p => !assignedThisInning.has(p.id))[0]?.id;
            if (pitcherId) previousPitchers.add(pitcherId);
          } else {
            pitcherId = lineup["1"]?.["Pitcher"] || "";
            if (pitcherId && assignedThisInning.has(pitcherId)) {
              pitcherId = "";
            }
            if (!pitcherId) {
              const starters = availablePlayers.filter(p => p.positions.includes("Starting Pitcher"));
              const pool = starters.length > 0 ? starters : availablePlayers.filter(p => canPlay(p, "Pitcher"));
              pitcherId = pickBestCandidate(pool)?.id || pool.filter(p => !assignedThisInning.has(p.id))[0]?.id;
            }
          }
        } else {
          const relievers = availablePlayers.filter(p => p.positions.includes("Relief Pitcher") && !previousPitchers.has(p.id));
          const pool = relievers.length > 0 ? relievers : availablePlayers.filter(p => canPlay(p, "Pitcher") && !previousPitchers.has(p.id));
          const filteredPool = pool.filter(p => lastBenched.has(p.id));
          const finalPool = filteredPool.length > 0 ? filteredPool : pool;
          const selected = pickBestCandidate(finalPool);
          if (selected) {
            pitcherId = selected.id;
            previousPitchers.add(pitcherId);
          } else {
            const fallbackPool = availablePlayers.filter(p => !assignedThisInning.has(p.id));
            pitcherId = fallbackPool[Math.floor(Math.random() * fallbackPool.length)]?.id;
          }
        }

        if (pitcherId) {
          lineup[inningKey]["Pitcher"] = pitcherId;
          assignedThisInning.add(pitcherId);
        }
      }

      const remainingPositions = sortedPositions.filter(pos => pos !== "Pitcher");
      let pool = availablePlayers.filter(p => !assignedThisInning.has(p.id));

      for (const pos of remainingPositions) {
        if (lineup[inningKey][pos]) continue;

        let candidates = pool.filter(p => canPlay(p, pos) && !assignedThisInning.has(p.id));
        
        if (pos === "Catcher") {
          candidates = candidates.filter(p => {
            let totalCaught = 0;
            for (let i = 1; i < inning; i++) {
              if (lineup[i.toString()]["Catcher"] === p.id) totalCaught++;
            }
            if (totalCaught >= 4) return false;

            if (inning > 2) {
              const caughtLast = lineup[(inning - 1).toString()]["Catcher"] === p.id;
              const caughtTwoAgo = lineup[(inning - 2).toString()]["Catcher"] === p.id;
              if (caughtLast && caughtTwoAgo) return false;
            }

            let totalPitched = 0;
            for (let i = 1; i < inning; i++) {
              if (lineup[i.toString()]["Pitcher"] === p.id) totalPitched++;
            }
            if (totalPitched >= 2) return false;

            let hasCaughtBefore = false;
            let hasPitchedAfterCatching = false;
            for (let i = 1; i < inning; i++) {
              if (lineup[i.toString()]["Catcher"] === p.id) {
                hasCaughtBefore = true;
              } else if (hasCaughtBefore && lineup[i.toString()]["Pitcher"] === p.id) {
                hasPitchedAfterCatching = true;
              }
            }
            if (hasCaughtBefore && hasPitchedAfterCatching) return false;
            
            return true;
          });
        }

        if (!settings?.allowOutfieldTwiceInRow && (pos === "Left Field" || pos === "Center Field" || pos === "Right Field")) {
          const outfieldPositions = ["Left Field", "Center Field", "Right Field"];
          const prevInningKey = (inning - 1).toString();
          const prevLineup = inning > 1 ? lineup[prevInningKey] : null;
          
          if (prevLineup) {
            const filteredNoRepeat = candidates.filter(p => {
              const playedOutfieldLastInning = outfieldPositions.some(op => prevLineup[op] === p.id);
              return !playedOutfieldLastInning;
            });
            if (filteredNoRepeat.length > 0) {
              candidates = filteredNoRepeat;
            }
          }
        }

        if (candidates.length === 0) {
          candidates = pool.filter(p => !assignedThisInning.has(p.id));
        }

        const mustPlay = candidates.filter(p => lastBenched.has(p.id));
        const finalCandidates = mustPlay.length > 0 ? mustPlay : candidates;
        
        const selected = pickBestCandidate(finalCandidates);
        if (selected) {
          lineup[inningKey][pos] = selected.id;
          assignedThisInning.add(selected.id);
        }
      }
    }

    const currentBenched = new Set<string>();
    availablePlayers.forEach(p => {
      if (!assignedThisInning.has(p.id)) {
        currentBenched.add(p.id);
        benchCounts[p.id]++;
      }
    });
    lastBenched = currentBenched;
  }

  return lineup;
}

export function fixLineup(game: Game, players: Player[]): { newLineup: Record<string, Record<string, string>>, newGroups?: string[][], fixedAny: boolean, skippedDueToLocks: boolean } {
  if (!game.lineup) return { newLineup: {}, fixedAny: false, skippedDueToLocks: false };

  const newLineup = JSON.parse(JSON.stringify(game.lineup));
  let fixedAny = false;
  let skippedDueToLocks = false;

  const availablePlayers = players.filter(p => game.rsvps[p.id] === RSVPStatus.YES || game.rsvps[p.id] === RSVPStatus.TENTATIVE);
  
  // Clean up scrimmage groups
  let newGroups = game.scrimmageGroups ? [...game.scrimmageGroups.map(g => [...g])] : undefined;
  if (newGroups) {
    newGroups = newGroups.map(group => {
      const filtered = group.filter(pId => game.rsvps[pId] !== RSVPStatus.NO);
      if (filtered.length !== group.length) fixedAny = true;
      return filtered;
    });
  }
  
  const fieldPositions = [
    "Pitcher", "Catcher", "First Base", "Second Base", "Third Base", 
    "Shortstop", "Left Field", "Center Field", "Right Field"
  ];

  const isPosLocked = (pos: string, inning: number) => {
    if (game.lockedInnings?.includes(inning)) return true;
    if (game.lockedPositions?.includes(pos)) return true;
    if (game.mode === 'scrimmage' && (pos === "Pitcher" || pos === "Catcher")) return true;
    return false;
  };

  const canPlay = (player: Player, pos: string) => {
    if (pos === "Pitcher") return (player.positions || []).includes("Starting Pitcher") || (player.positions || []).includes("Relief Pitcher");
    return (player.positions || []).includes(pos);
  };

  const getPlayCounts = (lineup: any) => {
    const counts: Record<string, number> = {};
    availablePlayers.forEach(p => counts[p.id] = 0);
    Object.values(lineup).forEach((inning: any) => {
      Object.entries(inning).forEach(([pos, id]) => {
        if (pos !== 'HittingGroup' && id && counts[id as string] !== undefined) {
          counts[id as string]++;
        }
      });
    });
    return counts;
  };

  const tryToFillPosition = (inning: number, pos: string, currentInningLineup: any): boolean => {
    const hittingGroupIdx = currentInningLineup['HittingGroup'];
    const hittingGroupIds = (game.mode === 'scrimmage' && hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
      ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
      : [];

    if (game.mode === 'scrimmage') {
      const ehPositions = Object.keys(currentInningLineup).filter(k => k.startsWith('Extra Hitter'));
      for (const ehPos of ehPositions) {
        const ehPlayerId = currentInningLineup[ehPos];
        if (ehPlayerId) {
          const p = players.find(player => player.id === ehPlayerId);
          if (p && canPlay(p, pos)) {
            currentInningLineup[pos] = ehPlayerId;
            delete currentInningLineup[ehPos];
            return true;
          }
        }
      }
    }

    const allAssignedIds = new Set(Object.values(currentInningLineup).filter(id => id && typeof id === 'string'));
    const benchCandidates = availablePlayers.filter(p => 
      !hittingGroupIds.includes(p.id) && 
      !allAssignedIds.has(p.id)
    );

    const preferred = benchCandidates.filter(p => canPlay(p, pos));
    
    if (preferred.length > 0) {
      currentInningLineup[pos] = preferred[0].id;
      return true;
    }

    if (benchCandidates.length > 0) {
      currentInningLineup[pos] = benchCandidates[0].id;
      return true;
    }

    const outfieldPos = ["Left Field", "Center Field", "Right Field"];
    if (!outfieldPos.includes(pos)) {
      for (const ofPos of outfieldPos) {
        const ofPlayerId = currentInningLineup[ofPos];
        if (ofPlayerId) {
          const ofPlayer = players.find(p => p.id === ofPlayerId);
          if (ofPlayer && canPlay(ofPlayer, pos)) {
            currentInningLineup[pos] = ofPlayerId;
            const filledOF = tryToFillPosition(inning, ofPos, currentInningLineup);
            if (!filledOF) {
              delete currentInningLineup[ofPos];
            }
            return true;
          }
        }
      }
    }

    return false;
  };

  if (game.mode === 'scrimmage') {
    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const inningLineup = newLineup[inningKey] || {};
      const hittingGroupIdx = inningLineup['HittingGroup'];
      const hittingGroupIds = (hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
        ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
        : [];

      const allPositions = Object.keys(inningLineup).filter(k => k !== 'HittingGroup');
      for (const pos of allPositions) {
        const playerId = inningLineup[pos];
        if (playerId && hittingGroupIds.includes(playerId)) {
          delete inningLineup[pos];
          fixedAny = true;
        }
      }
      newLineup[inningKey] = inningLineup;
    }
  }

  for (let inning = 1; inning <= 6; inning++) {
    const inningKey = inning.toString();
    const inningLineup = newLineup[inningKey] || {};
    
    const playerPositions: Record<string, string[]> = {};
    Object.entries(inningLineup).forEach(([pos, id]) => {
      if (id && pos !== 'HittingGroup') {
        if (!playerPositions[id as string]) playerPositions[id as string] = [];
        playerPositions[id as string].push(pos);
      }
    });

    Object.entries(playerPositions).forEach(([playerId, positions]) => {
      if (positions.length > 1) {
        if (game.lockedInnings?.includes(inning)) {
          skippedDueToLocks = true;
          return;
        }

        const lockedPositionsForPlayer = positions.filter(pos => isPosLocked(pos, inning));
        
        if (lockedPositionsForPlayer.length > 1) {
          skippedDueToLocks = true;
        } else {
          let positionToKeep = lockedPositionsForPlayer.length === 1 
            ? lockedPositionsForPlayer[0] 
            : positions[0];
          
          positions.forEach(pos => {
            if (pos !== positionToKeep) {
              const replaced = tryToFillPosition(inning, pos, inningLineup);
              if (!replaced) {
                delete inningLineup[pos];
              }
              fixedAny = true;
            }
          });
        }
      }
    });
    newLineup[inningKey] = inningLineup;
  }

  for (let inning = 1; inning <= 6; inning++) {
    const inningKey = inning.toString();
    const inningLineup = newLineup[inningKey] || {};
    
    for (const pos of fieldPositions) {
      if (isPosLocked(pos, inning)) continue;
      const playerId = inningLineup[pos];
      if (playerId && game.rsvps[playerId] === RSVPStatus.NO) {
        delete inningLineup[pos];
        const replaced = tryToFillPosition(inning, pos, inningLineup);
        if (replaced) {
          fixedAny = true;
        } else {
          fixedAny = true;
        }
      }
    }
    newLineup[inningKey] = inningLineup;
  }

  let playCounts = getPlayCounts(newLineup);
  const zeroPlayPlayers = availablePlayers.filter(p => playCounts[p.id] === 0);

  if (zeroPlayPlayers.length > 0) {
    const targetInnings = availablePlayers.length > 13 ? 1 : 2;

    for (const player of zeroPlayPlayers) {
      let assignedCount = 0;
      const innings = [1, 2, 3, 4, 5, 6].sort((a, b) => {
        const aLocked = game.lockedInnings?.includes(a) ? 1 : 0;
        const bLocked = game.lockedInnings?.includes(b) ? 1 : 0;
        return aLocked - bLocked;
      });

      for (const inning of innings) {
        if (assignedCount >= targetInnings) break;
        const inningKey = inning.toString();
        const inningLineup = newLineup[inningKey] || {};
        
        if (Object.values(inningLineup).includes(player.id)) continue;

        let bestPosToSwap = "";
        let maxPlayCount = -1;

        for (const pos of fieldPositions) {
          if (isPosLocked(pos, inning) && inningLineup[pos]) continue;

          const currentPlayerId = inningLineup[pos] as string;
          if (!currentPlayerId) {
            bestPosToSwap = pos;
            maxPlayCount = 999;
            break;
          }

          if (canPlay(player, pos)) {
            const currentCount = playCounts[currentPlayerId] || 0;
            if (currentCount > maxPlayCount) {
              maxPlayCount = currentCount;
              bestPosToSwap = pos;
            }
          }
        }

        if (bestPosToSwap && (maxPlayCount > 1 || maxPlayCount === 999)) {
          inningLineup[bestPosToSwap] = player.id;
          fixedAny = true;
          assignedCount++;
          playCounts = getPlayCounts(newLineup);
        }
      }
    }
  }

  if (availablePlayers.length > 0) {
    let hasBackToBack = true;
    let iterations = 0;
    while (hasBackToBack && iterations < 10) {
      hasBackToBack = false;
      iterations++;
      
      for (const player of availablePlayers) {
        const isBenched = (inning: number) => {
          if (inning < 1 || inning > 6) return false;
          const lineup = newLineup[inning.toString()] || {};
          const assignedToField = Object.entries(lineup)
            .filter(([k]) => k !== 'HittingGroup' && !k.startsWith('Extra Hitter'))
            .map(([_, id]) => id);
          const hittingGroupIdx = lineup['HittingGroup'];
          const hittingGroupIds = (game.mode === 'scrimmage' && hittingGroupIdx != null && game.scrimmageGroups?.[parseInt(hittingGroupIdx)])
            ? game.scrimmageGroups[parseInt(hittingGroupIdx)]
            : [];
          return !assignedToField.includes(player.id) && !hittingGroupIds.includes(player.id);
        };
        
        for (let i = 1; i <= 5; i++) {
          if (isBenched(i) && isBenched(i+1)) {
            const targetInnings = [i, i + 1];
            let swapped = false;

            for (const targetInning of targetInnings) {
              if (swapped) break;
              const inningKey = targetInning.toString();
              const inningLineup = newLineup[inningKey] || {};
              
              for (const pos of fieldPositions) {
                if (isPosLocked(pos, targetInning) && inningLineup[pos]) continue;

                const currentPlayerId = inningLineup[pos] as string;
                
                if (!currentPlayerId) {
                  inningLineup[pos] = player.id;
                  swapped = true;
                  fixedAny = true;
                  break;
                }

                if (canPlay(player, pos)) {
                  const isBenchedAfterSwap = (inn: number) => {
                    if (inn < 1 || inn > 6) return false;
                    if (inn === targetInning) return true; 
                    
                    const l = newLineup[inn.toString()] || {};
                    const field = Object.entries(l).filter(([k]) => k !== 'HittingGroup').map(([_, id]) => id);
                    const hgIdx = l['HittingGroup'];
                    const hgIds = (game.mode === 'scrimmage' && hgIdx != null && game.scrimmageGroups?.[parseInt(hgIdx)])
                      ? game.scrimmageGroups[parseInt(hgIdx)]
                      : [];
                    return !field.includes(currentPlayerId) && !hgIds.includes(currentPlayerId);
                  };
                  
                  const wouldCreateBTB = (isBenchedAfterSwap(targetInning - 1) || isBenchedAfterSwap(targetInning + 1));
                  
                  if (!wouldCreateBTB) {
                    inningLineup[pos] = player.id;
                    swapped = true;
                    fixedAny = true;
                    break;
                  }
                }
              }
            }
            
            if (swapped) {
              hasBackToBack = true;
              break;
            }
          }
        }
      }
    }
  }

  return { newLineup, newGroups, fixedAny, skippedDueToLocks };
}

export function generateScrimmageLineup(game: Game): Record<string, Record<string, string>> {
  if (!game.scrimmageGroups) return game.lineup || {};

  const newLineup = { ...game.lineup };
  const groups = game.scrimmageGroups;
  
  const otherPositions = ["First Base", "Second Base", "Third Base", "Shortstop", "Left Field", "Center Field", "Right Field"];
  
  const allSchedules: number[][] = [];
  const permute = (arr: number[]): number[][] => {
    if (arr.length === 0) return [[]];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of permute(rest)) {
        result.push([arr[i], ...p]);
      }
    }
    return result;
  };
  
  const first4Perms = permute([0, 1, 2, 3]);
  for (const f4 of first4Perms) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (i !== j) {
          allSchedules.push([...f4, i, j]);
        }
      }
    }
  }
  
  const validSchedules = allSchedules.filter(schedule => {
    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const pId = game.lineup?.[inningKey]?.['Pitcher'];
      const cId = game.lineup?.[inningKey]?.['Catcher'];
      const groupIdx = schedule[inning - 1];
      if ((pId && groups[groupIdx].includes(pId)) || (cId && groups[groupIdx].includes(cId))) {
        return false;
      }
    }
    return true;
  });
  
  let hittingSchedule: number[];
  if (validSchedules.length > 0) {
    let bestSchedules: number[][] = [];
    let maxScore = -1;

    for (const schedule of validSchedules) {
      let score = 0;
      if (schedule[4] === schedule[0]) score += 100;
      if (schedule[5] === schedule[1]) score += 100;
      
      const wait5 = 4 - schedule.indexOf(schedule[4]); 
      score += wait5;
      
      const wait6 = 5 - schedule.indexOf(schedule[5]);
      score += wait6;

      if (score > maxScore) {
        maxScore = score;
        bestSchedules = [schedule];
      } else if (score === maxScore) {
        bestSchedules.push(schedule);
      }
    }
    hittingSchedule = bestSchedules[Math.floor(Math.random() * bestSchedules.length)];
  } else {
    hittingSchedule = [];
    const counts = [0, 0, 0, 0];
    const lastBatted = [-1, -1, -1, -1];
    for (let inning = 1; inning <= 6; inning++) {
      const inningKey = inning.toString();
      const pId = game.lineup?.[inningKey]?.['Pitcher'];
      const cId = game.lineup?.[inningKey]?.['Catcher'];
      
      let bestGroup = -1;
      let minHits = 999;
      let maxWait = -1;
      
      const availableGroups = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      for (const j of availableGroups) {
        if ((!pId || !groups[j].includes(pId)) && (!cId || !groups[j].includes(cId))) {
          const wait = lastBatted[j] === -1 ? 999 : inning - lastBatted[j];
          if (counts[j] < minHits || (counts[j] === minHits && wait > maxWait)) {
            minHits = counts[j];
            maxWait = wait;
            bestGroup = j;
          }
        }
      }
      
      if (bestGroup === -1) bestGroup = 0;
      hittingSchedule.push(bestGroup);
      counts[bestGroup]++;
      lastBatted[bestGroup] = inning;
    }
  }

  const extraHitterCounts: Record<string, number> = {};
  const outfieldCounts: Record<string, number> = {};

  const twoHitGroups = [hittingSchedule[4], hittingSchedule[5]];
  const oneHitGroups = [0, 1, 2, 3].filter(g => !twoHitGroups.includes(g));

  const isOneHitGroup = (pid: string) => {
    return oneHitGroups.some(gIdx => groups[gIdx].includes(pid));
  };

  for (let inning = 1; inning <= 6; inning++) {
    const inningKey = inning.toString();
    const hittingGroupIndex = hittingSchedule[inning - 1];
    
    const pId = game.lineup?.[inningKey]?.['Pitcher'];
    const cId = game.lineup?.[inningKey]?.['Catcher'];
    
    const actualHittingGroup = groups[hittingGroupIndex];
    const fieldingGroups = groups.filter((_, idx) => idx !== hittingGroupIndex);
    
    let fieldingPool: string[] = [];
    fieldingGroups.forEach(g => {
      g.forEach(pid => {
        if (pid !== pId && pid !== cId) {
          fieldingPool.push(pid);
        }
      });
    });
    
    fieldingPool.sort((a, b) => {
      const countA = extraHitterCounts[a] || 0;
      const countB = extraHitterCounts[b] || 0;
      if (countA !== countB) return countB - countA; 
      
      const aOneHit = isOneHitGroup(a);
      const bOneHit = isOneHitGroup(b);
      if (aOneHit && !bOneHit) return 1; 
      if (!aOneHit && bOneHit) return -1; 
      
      return Math.random() - 0.5;
    });
    
    const inningLineup: Record<string, string> = { 
      Pitcher: pId || '', 
      Catcher: cId || '' 
    };
    
    const selectedFielders = fieldingPool.slice(0, otherPositions.length);
    const extraHitters = fieldingPool.slice(otherPositions.length);
    
    selectedFielders.sort((a, b) => {
      const countA = outfieldCounts[a] || 0;
      const countB = outfieldCounts[b] || 0;
      if (countA !== countB) return countB - countA; 
      return Math.random() - 0.5;
    });
    
    otherPositions.forEach((pos, idx) => {
      if (selectedFielders[idx]) {
        inningLineup[pos] = selectedFielders[idx];
        if (["Left Field", "Center Field", "Right Field"].includes(pos)) {
          outfieldCounts[selectedFielders[idx]] = (outfieldCounts[selectedFielders[idx]] || 0) + 1;
        }
      }
    });
    
    extraHitters.forEach((pid, idx) => {
      inningLineup[`Extra Hitter ${idx + 1}`] = pid;
      extraHitterCounts[pid] = (extraHitterCounts[pid] || 0) + 1;
    });
    
    inningLineup['HittingGroup'] = hittingGroupIndex.toString();
    
    newLineup[inningKey] = inningLineup;
  }

  return newLineup;
}

export function fixInningBatteries(game: Game, players: Player[], inningKey: string): Record<string, Record<string, string>> {
  const eligiblePitchers = players.filter(p => 
    (p.positions.includes('Starting Pitcher') || 
    p.positions.includes('Relief Pitcher') || 
    p.positions.includes('First Base')) &&
    game.rsvps[p.id] !== RSVPStatus.NO
  );
  const eligibleCatchers = players.filter(p => 
    (p.positions.includes('Catcher') || 
    p.positions.includes('First Base') || 
    p.positions.includes('Third Base')) &&
    game.rsvps[p.id] !== RSVPStatus.NO
  );

  const newLineup = { ...game.lineup };
  if (!newLineup[inningKey]) newLineup[inningKey] = {};

  const pitchCounts: Record<string, number> = {};
  const catchCounts: Record<string, number> = {};

  for (let i = 1; i <= 6; i++) {
    const ik = i.toString();
    if (ik === inningKey) continue;
    
    const pId = newLineup[ik]?.['Pitcher'];
    const cId = newLineup[ik]?.['Catcher'];
    if (pId) pitchCounts[pId] = (pitchCounts[pId] || 0) + 1;
    if (cId) catchCounts[cId] = (catchCounts[cId] || 0) + 1;
  }

  const currentPitcherId = newLineup[inningKey]['Pitcher'];
  const currentCatcherId = newLineup[inningKey]['Catcher'];

  let newPitcherId = currentPitcherId;
  let newCatcherId = currentCatcherId;

  if (currentPitcherId && game.rsvps[currentPitcherId] === RSVPStatus.NO) {
    const availablePitchers = eligiblePitchers.filter(p => p.id !== currentCatcherId).sort((a, b) => (pitchCounts[a.id] || 0) - (pitchCounts[b.id] || 0));
    const minPitchCount = availablePitchers.length > 0 ? (pitchCounts[availablePitchers[0].id] || 0) : 0;
    const bestPitchers = availablePitchers.filter(p => (pitchCounts[p.id] || 0) === minPitchCount);
    const chosenPitcher = bestPitchers.length > 0 ? bestPitchers[Math.floor(Math.random() * bestPitchers.length)] : null;
    if (chosenPitcher) {
      newPitcherId = chosenPitcher.id;
      newLineup[inningKey]['Pitcher'] = newPitcherId;
    }
  }

  if (currentCatcherId && game.rsvps[currentCatcherId] === RSVPStatus.NO) {
    const availableCatchers = eligibleCatchers.filter(p => p.id !== newPitcherId).sort((a, b) => (catchCounts[a.id] || 0) - (catchCounts[b.id] || 0));
    const minCatchCount = availableCatchers.length > 0 ? (catchCounts[availableCatchers[0].id] || 0) : 0;
    const bestCatchers = availableCatchers.filter(p => (catchCounts[p.id] || 0) === minCatchCount);
    const chosenCatcher = bestCatchers.length > 0 ? bestCatchers[Math.floor(Math.random() * bestCatchers.length)] : null;
    if (chosenCatcher) {
      newCatcherId = chosenCatcher.id;
      newLineup[inningKey]['Catcher'] = newCatcherId;
    }
  }

  return newLineup;
}

export function generateBatteries(game: Game, players: Player[]): Record<string, Record<string, string>> {
  const eligiblePitchers = players.filter(p => 
    (p.positions.includes('Starting Pitcher') || 
    p.positions.includes('Relief Pitcher') || 
    p.positions.includes('First Base')) &&
    game.rsvps[p.id] !== RSVPStatus.NO
  );
  const eligibleCatchers = players.filter(p => 
    (p.positions.includes('Catcher') || 
    p.positions.includes('First Base') || 
    p.positions.includes('Third Base')) &&
    game.rsvps[p.id] !== RSVPStatus.NO
  );

  const newLineup = { ...game.lineup };
  const pitchCounts: Record<string, number> = {};
  const catchCounts: Record<string, number> = {};

  for (let inning = 1; inning <= 6; inning++) {
    const inningKey = inning.toString();
    if (!newLineup[inningKey]) newLineup[inningKey] = {};
    
    const availablePitchers = [...eligiblePitchers].sort((a, b) => (pitchCounts[a.id] || 0) - (pitchCounts[b.id] || 0));
    const minPitchCount = availablePitchers.length > 0 ? (pitchCounts[availablePitchers[0].id] || 0) : 0;
    const bestPitchers = availablePitchers.filter(p => (pitchCounts[p.id] || 0) === minPitchCount);
    
    const pitcher = bestPitchers.length > 0 
      ? bestPitchers[Math.floor(Math.random() * bestPitchers.length)] 
      : null;
    
    if (pitcher) {
      newLineup[inningKey]['Pitcher'] = pitcher.id;
      pitchCounts[pitcher.id] = (pitchCounts[pitcher.id] || 0) + 1;
    }

    const availableCatchers = eligibleCatchers.filter(p => p.id !== pitcher?.id).sort((a, b) => (catchCounts[a.id] || 0) - (catchCounts[b.id] || 0));
    const minCatchCount = availableCatchers.length > 0 ? (catchCounts[availableCatchers[0].id] || 0) : 0;
    const bestCatchers = availableCatchers.filter(p => (catchCounts[p.id] || 0) === minCatchCount);

    const catcher = bestCatchers.length > 0 
      ? bestCatchers[Math.floor(Math.random() * bestCatchers.length)] 
      : null;
    
    if (catcher) {
      newLineup[inningKey]['Catcher'] = catcher.id;
      catchCounts[catcher.id] = (catchCounts[catcher.id] || 0) + 1;
    }
  }

  return newLineup;
}

export function splitScrimmageGroups(game: Game, players: Player[]): string[][] {
  const availablePlayers = players.filter(p => game.rsvps[p.id] !== RSVPStatus.NO);
  const numGroups = game.numGroups || 4;
  
  const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
  
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  shuffled.forEach((p, i) => {
    groups[i % numGroups].push(p.id);
  });

  return groups;
}
