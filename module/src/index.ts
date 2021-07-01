import VF from 'vexflow';

/**
 * Identifies the closest item as well as the index within the list of that item.
 * @param iterable The list of items to iterate through.
 * @param closestFunct The function assigning a distance of an item of type T.
 * @returns The index of the closest item in the list as well as the item itself.
 */
function getClosest<T>(iterable: T[], closestFunct: (item: T) => number | undefined): ({ idx: number, item: T } | undefined) {
  let closest: { idx: number, item: T } | undefined = undefined;
  let distance: number | undefined = undefined;
  for (let i = 0; i < iterable.length; i++) {
    let thisItem = iterable[i];
    let thisDistance = closestFunct(thisItem);
    if (thisDistance === undefined) {
      continue;
    }
    else if (thisDistance <= 0) {
      return { idx: i, item: thisItem };
    }
    if (distance === undefined || thisDistance < distance) {
      closest = { idx: i, item: thisItem };
      distance = thisDistance;
    }
  }

  return closest;
}

/**
 * Identifies the closest system measure using the bounding box of the system measure.
 * @param systems The system measures.
 * @param pt The point.
 * @returns The index of the closest system measure as well as the system measure.
 */
function getClosestSystemMeasure(systems: VF.Flow.System[], pt: { x: number, y: number }) {
  return getClosest(systems,
    (meas: any) => {
      let x = meas?.options?.x;
      let y = meas?.options?.y;
      let w = meas?.options?.width;
      let h = y !== undefined && meas?.lastY && meas.lastY - y > 0 ?
        meas.lastY - y : undefined;

      return (x !== undefined && y !== undefined &&
        w !== undefined && h !== undefined) ?
        getDistance(pt, { x, y, w, h }) : undefined;
    });
}

/**
 * Given a number min and max, provides the distance from the number to
 * that min/max range.  Numbers within the range are assigned 0.  If the range was [1,3],
 * 2 => 0
 * 1 => 0
 * 3 => 0
 * 0 => 1
 * 4 => 1
 * @param num The number.
 * @param min The minimum number in the range.
 * @param max The maximum number in the range.
 * @returns The distance outside that range or 0.
 */
function getAbsOutsideRange(num: number, min: number, max: number): number {
  if (num < min) {
    return min - num;
  } else if (num > max) {
    return num - max;
  } else {
    return 0;
  }
}

/**
 * Returns the y coordinate of the center of the stave.
 * @param stave The stave.
 * @returns The center y position of the stave.
 */
function getStaveCenterY(stave: VF.Flow.Stave) {
  return stave.getYForLine(((stave.options.num_lines || 5) - 1) / 2);
}

export type Point = { x: number, y: number };

/**
 * Returns the offset from the center line of the staves in terms of
 * pitches.  For instance, if selecting E4 on treble, will be ~3.
 * @param stave The stave.
 * @param pt The point.
 */
function getCenterLineOffset(stave: VF.Flow.Stave, pt: Point) {
  let centerY = getStaveCenterY(stave);
  let spacing = stave.options.spacing_between_lines_px || 0;
  return Math.round((centerY - pt.y) / (spacing / 2));
}

/**
 * Gets the distance of a point to a bounding box returning 0 if within.
 * @param point The point.
 * @param boundingBox The bounding box.
 * @returns The distance of the point to the bounding box.
 */
function getDistance(point: Point, boundingBox: { x: number, y: number, w: number, h: number }): number {
  let { x, y } = point;
  let { x: xbb, y: ybb, w, h } = boundingBox;
  let xDiff = getAbsOutsideRange(x, xbb, xbb + w);
  let yDiff = getAbsOutsideRange(y, ybb, ybb + h);
  return Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
}

/**
 * A tickable and beats from beginning of that measure to that tickable
 * (i.e. if quarter, eighth, eighth: the second eighth at 3/8)
 */
type TickableAndBeat = { tickable: VF.Flow.Tickable, beat: VF.Flow.Fraction };


/**
 * Transforms the tickables in a voice into a list of tickables mapped to their beat.
 * @param voice The voice to iterate through.
 * @returns The list of tickables with their beats.
 */
function getTickablesAndBeats(voice: VF.Flow.Voice): TickableAndBeat[] {

  let resolution = voice.getActualResolution();
  let totalTicks = new VF.Flow.Fraction(0, 1);

  // iterate through tickables ordered chronologically
  let items = [];
  for (let t of voice.getTickables()) {
    items.push({ tickable: t, beat: totalTicks });
    let thisTicks = t.getTicks();

    // track the current beats 
    // (i.e. given a quarter and two eighths, the second eighth is at 3/8)
    let adjusted = thisTicks.clone().divide(resolution, 1);
    totalTicks = totalTicks.clone()
      .add((adjusted as any).numerator, (adjusted as any).denominator)
      .simplify();
  }

  // return the item before and after for what exists
  return items;
}

/**
 * Returns the tickable before and after for the tickables in a voice.  
 * If no tickable exists before and/or after, an item is not returned.
 * @param voice The point.
 * @param ptX The x coordinate of the point.
 * @returns A list of the closest (at most 2: one before and after) tickables to the point.
 */
function getClosestTickable(voice: VF.Flow.Voice, ptX: number): TickableAndBeat[] {
  let itemBefore = undefined;
  let itemAfter = undefined;

  // iterate through tickables ordered chronologically
  for (let tickAndBeat of getTickablesAndBeats(voice)) {
    let { tickable } = tickAndBeat;
    let tickableBB = tickable.getBoundingBox();
    if (!tickableBB) {
      continue;
    }

    let x = tickableBB.getX();
    let w = tickableBB.getW();

    // if the x position of this tickable has exceeded the x position,
    // it is after the point.  So, break out of the loop.
    if (x > ptX) {
      itemAfter = tickAndBeat;
      break;
    }

    // otherwise, track this item.
    itemBefore = tickAndBeat;

    // if this item's bounds contain the x point, this is the item we want.
    if (x + w > ptX) {
      break;
    }
  }

  // return the item before and after for what exists
  return ([itemBefore, itemAfter].filter((item) => item !== undefined) as
    { tickable: VF.Flow.Tickable, beat: VF.Flow.Fraction }[]);
}


/**
 * Get metrics on the closest tickable and beat of a point to a list of voices.
 * @param voices The list of voices.
 * @param pt The point to check proximity.
 * @returns 
 *    closestBefore: The closest tickable whose starting x position is before the x point of the point.
 *    closest: The closest tickable (not necessarily before) determined by distance of point to bounding box of tickable.
 */
function getClosestTickableResult(voices: VF.Flow.Voice[], pt: Point): {
  closestTickableBefore: TickableAndBeat | undefined,
  closestTickable: TickableAndBeat | undefined
} {

  let closestTickableList = voices.map((v: any) => getClosestTickable(v, pt.x));

  let closestTickableBefore = closestTickableList.reduce((prevBest, curList) => {
    if (!curList || curList.length < 1)
      return prevBest;

    return getClosest([prevBest, curList[0] as any].filter(i => i !== undefined),
      (item) => getDistance(pt, item.tickable.getBoundingBox() as any))?.item;
  }, undefined as any)

  let closestTickable = closestTickableList.flatMap((lst) => lst).reduce((prevBest, cur) => {
    return getClosest([prevBest, cur as any].filter(i => i !== undefined),
      (item) => getDistance(pt, item.tickable.getBoundingBox() as any))?.item;
  }, undefined as any)

  return {
    closestTickable,
    closestTickableBefore
  }
}

/**
 * Converts the accidental to its semitones offset from natural.
 * @param accidental The accidental.  Undefined will be treated as a 0.
 * @returns The semitone difference from a natural note (i.e. double sharp is 2, flat is -1)
 */
function getAccidentalOffset(accidental: Accidental | undefined): number {
  if (!accidental) {
    return 0;
  }

  switch (accidental.toLocaleLowerCase()) {
    case "bb": return -2;
    case "b": return -1;
    case "#": return 1;
    case "##": return 2;
    case "n": return 0;
    default: return 0;
  }
}


/**
 * Represents information about a note (i.e. Bb).
 */
export type NoteEntry = {
  /**
   * Semitones from C (i.e. Eb would be 3).
   */
  semitoneVal: number,
  /**
   * The note (i.e. Eb).
   */
  noteName: Note,
  /**
   * Note letter difference from C (i.e. E is 2).
   */
  noteLetterIdx: number
}

/**
 * A mapping of the note letter idx (index above C, so E would be 2).
 */
export type NoteMapping = {
  [noteLetterIdx: number]: {
    /**
     * maps the accidental offset (i.e. sharp is 1, double flat is -2) to the NoteEntry.
     */
    [accidentalOffset: number]: NoteEntry,
    /**
     * The note letter for this entry.
     */
    noteLetter: NoteLetter
  }
};

/**
 * Creates a NoteMapping using VF.Flow.keyProperties to perform
 * lookups of note meta data.
 */
export function getNoteMap(): NoteMapping {
  let mapping: NoteMapping = {};
  for (let [noteName, val] of Object.entries((VF.Flow.keyProperties as any).note_values)) {
    let { index: noteLetterIdx, int_val: semitoneVal, accidental, rest, code } = val as any;
    if (rest || code)
      continue;

    let items = mapping[noteLetterIdx];
    if (!items) {
      items = {
        noteLetter: noteName[0] as NoteLetter
      };
      mapping[noteLetterIdx] = items;
    }

    let accidentalOffset = getAccidentalOffset(accidental);

    let noteLetter = noteName[0] as NoteLetter;

    items[accidentalOffset] = {
      semitoneVal,
      noteName: {
        accidental: accidental || 'n',
        noteLetter
      },
      noteLetterIdx
    }
  }
  return mapping;
}

/**
 * A NoteMapping derived from vexflow key properties.
 */
export const NOTE_MAPPING = getNoteMap();

/**
 * The note and the octave for that note.
 */
export type NoteAndOctave = { note: NoteEntry, octave: number };

/**
 * Record for determining the accidentals at any given point 
 * in the measure.
 */
type EffectiveAccidentals = {
  // Tracks the accidentals determined by the key signature.
  keySig: KeySigAccidentals;
  // accidentals in the measure that remain throughout the rest of the measure.
  accidentalOverrides: AccidentalOverrides;
}


/**
 * Determines the note and octave based on the center line index on the stave.
 * 
 * For instance, if a click happens on the space above center line on a treble
 * clef, then C5 should be returned.
 * 
 * @param noteMap A mapping of note letters to metadata about that note.
 * @param clef The clef (i.e. 'treble', 'bass', etc. as defined by VF.Flow.clefProperties.values)
 * @param centerLineOffset The index above or below the center line of the stave.
 * @param octaveShift If the clef has an octave shift, this is the octave shift.
 * @param effectiveAccidentals Accidentals based on the key signature and notes with accidentals 
 * in the measure.  If left undefined, the note returned will have no accidental.
 * @returns The note and octave corresponding to the click.
 */
function getNoteAndOctave(
  noteMap: NoteMapping,
  clef: string,
  centerLineOffset: number,
  octaveShift: number = 0,
  effectiveAccidentals: EffectiveAccidentals | undefined):
  NoteAndOctave | undefined {

  let clefLineShift = VF.Flow.clefProperties(clef).line_shift;
  let lineShiftOffset = centerLineOffset - clefLineShift * 2 - 1;
  let octave = 5 - octaveShift;
  while (lineShiftOffset < 0) {
    lineShiftOffset += 7;
    octave -= 1;
  }

  while (lineShiftOffset >= 7) {
    lineShiftOffset -= 7;
    octave += 1;
  }


  let noteLetterMap = noteMap[lineShiftOffset]
  if (!noteLetterMap)
    return undefined;

  let noteLetter = noteLetterMap.noteLetter;
  let accidentalOffset = 0;
  if (effectiveAccidentals) {
    let accidental = effectiveAccidentals.accidentalOverrides[noteLetter + octave];
    if (!accidental) {
      accidental = effectiveAccidentals.keySig[noteLetter];
    }

    if (accidental) {
      accidentalOffset = getAccidentalOffset(accidental);
    }
  }

  let note = noteLetterMap[accidentalOffset];
  return { note, octave };
}

/**
 * Different types of accidentals.  
 */
type Accidental = "bb" | "b" | "n" | "#" | "##";

/**
 * Different note letters.
 */
type NoteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

/**
 * Describes a note with no respect to octave including
 * the note letter and the accidental.
 */
type Note = { noteLetter: NoteLetter, accidental: Accidental | undefined }

/**
 * A mapping of notes to accidentals representing a key signature
 * (i.e. Bb keysignature would have a Bb and Eb).
 */
type KeySigAccidentals = { [noteLetter: string]: Accidental }

/**
 * A mapping of notes to accidentals representing measure accidentals.
 */
type AccidentalOverrides = { [noteLetter: string]: Accidental }

/**
 * Parses a note string (i.e. C#) into the relevant note object.
 * @param noteStr The note string.
 * @returns The parsed note or undefined if it cannot be parsed.
 */
function parseNote(noteStr: string): Note | undefined {
  let trimmed = noteStr.trim();
  if (!trimmed || !trimmed.length) {
    return undefined;
  } else {
    let noteLetter = trimmed[0].toUpperCase() as NoteLetter;

    switch (noteLetter) {
      case 'A':
      case 'B':
      case 'C':
      case 'D':
      case 'E':
      case 'F':
      case 'G':
        break;
      default:
        return undefined;
    }

    let accidental: Accidental | undefined = undefined;
    let accidentalStr = trimmed.substring(1);
    if (accidentalStr.length > 0) {
      accidental = accidentalStr as Accidental;

      switch (accidental) {
        case '##':
        case '#':
        case 'b':
        case 'bb':
        case 'n':
          break;
        default:
          return undefined;
      }
    }

    return {
      accidental,
      noteLetter
    }
  }
}

/**
 * Format a note object into the relevant string (i.e. Bb).
 * @param note The note object.
 * @returns The relevant string (i.e. Bb).
 */
function formatNote(note: Note): string {
  return note.noteLetter + (note.accidental || "");
}

/**
 * Parses a note string of form C#4 into its constituent parts.
 * @param noteWithOctave The note string.
 * @returns The parsed note.
 */
function parseNoteAndOctave(noteWithOctave: string): { note: Note, octave: number } | undefined {
  let pieces = noteWithOctave.split("/");
  if (pieces.length !== 2) {
    return undefined;
  }

  let note = parseNote(pieces[0]);
  let octave = parseInt(pieces[1], 10);
  return (note && octave && !isNaN(octave))
    ? { note, octave }
    : undefined;
}

/**
 * Accidentals for each key signature.
 */
const KEY_SIGNATURE_ACCIDENTALS: { [key: string]: string[] } = {
  "C": [],

  "G": ["F#"],
  "D": ["F#", "C#"],
  "A": ["F#", "C#", "G#"],
  "E": ["F#", "C#", "G#", "D#"],
  "B": ["F#", "C#", "G#", "D#", "A#"],
  "F#": ["F#", "C#", "G#", "D#", "A#", "E#"],
  "C#": ["F#", "C#", "G#", "D#", "A#", "E#", "B#"],

  "F": ["Bb"],
  "Bb": ["Bb", "Eb"],
  "Eb": ["Bb", "Eb", "Ab"],
  "Ab": ["Bb", "Eb", "Ab", "Db"],
  "Db": ["Bb", "Eb", "Ab", "Db", "Gb"],
  "Gb": ["Bb", "Eb", "Ab", "Db", "Gb", "Cb"],
  "Cb": ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"]
}

/**
 * Creates a mapping of key signature to the note accidentals in that key signature.
 * @param keySigs The key signatures mapping the key signature (Bb) to the accidentals (Bb, Eb)
 * @returns The mapping of keys to accidentals in that key.
 */
function _convertToMap(keySigs: { [note: string]: string[] }): { [note: string]: KeySigAccidentals } {
  let toRet: { [note: string]: KeySigAccidentals } = {};
  for (let [noteStr, keysStr] of Object.entries(keySigs)) {
    let note = parseNote(noteStr);
    if (note) {
      let accidentalMap: { [noteLetter: string]: Accidental } = {};
      for (let accidentalNoteStr of keysStr) {
        let accidentalNote = parseNote(accidentalNoteStr);
        if (accidentalNote && accidentalNote.accidental) {
          accidentalMap[accidentalNote?.noteLetter as string] = accidentalNote.accidental;
        }
      }

      toRet[formatNote(note)] = accidentalMap;
    }
  }

  return toRet;
}

/**
 * Maps key signatures (i.e. Bb) to a list of the accidentals in that key signature (Bb, Eb).
 */
export const KEY_SIGNATURE_MAP = _convertToMap(KEY_SIGNATURE_ACCIDENTALS);

/**
 * Get the note accidentals for the vexflow key signature.
 * @param keySig The key signature.
 * @returns The accidentals in the key signature.
 */
function getKeySigAccidentals(keySig: VF.Flow.KeySignature): KeySigAccidentals | undefined {
  let keyNoteStr = (keySig as any).keySpec;
  let keyNote = parseNote(keyNoteStr);
  if (keyNote) {
    return KEY_SIGNATURE_MAP[formatNote(keyNote)];
  } else {
    return undefined;
  }
}

/**
 * Compares two fractions returning the compare number (i.e. -1 for <, 0 for equal, 1 for >).
 * @param a The first fraction.
 * @param b The second fraction.
 */
function compareFractions(a: VF.Flow.Fraction, b: VF.Flow.Fraction): number {
  let difference = (a.clone() as any).subtract(b).numerator as number;
  return Math.min(1, Math.max(-1, difference));
}

/**
 * Get the accidentals in the voices.
 * @param voices The voices to iterate through looking for accidentals.
 * @param stopBeat Accidentals are identified from the beginning of the measure until this beat.
 * @returns all the measure accidentals to be considered.
 */
function getVoicesAccidentals(voices: VF.Flow.Voice[], stopBeat: VF.Flow.Fraction): AccidentalOverrides {
  let accidentalMap: AccidentalOverrides = {};

  voices
    .flatMap(v => getTickablesAndBeats(v))
    .flatMap(({ tickable, beat }) => {
      if ((tickable as any).getCategory() === VF.Flow.StaveNote.CATEGORY) {
        let staveNote = tickable as VF.Flow.StaveNote;
        let accidentals: { [idx: number]: string } = {};
        if ((staveNote as any).modifiers) {
          for (let modifier of (staveNote as any).modifiers) {
            if (modifier.getCategory() === VF.Flow.Accidental.CATEGORY) {
              accidentals[modifier.index] = modifier.type;
            }
          }
        }

        return (tickable as VF.Flow.StaveNote).getKeys()
          .map((key, idx) => ({ key, beat, accidental: accidentals[idx] }));

      } else {
        return [];
      }
    })
    .map(({ key, beat, accidental }) => {
      let parsedNote = parseNoteAndOctave(key);
      if (accidental && parsedNote?.note && !parsedNote.note.accidental) {
        parsedNote.note.accidental = accidental as Accidental;
      }

      return { note: parsedNote, beat };
    })
    .filter(({ note, beat }) => (note && note.note.accidental && compareFractions(beat, stopBeat) <= 0))
    .sort((a, b) => compareFractions(a.beat, b.beat))
    .forEach(({ note }) => {
      if (!note || !note.note.accidental)
        return;

      accidentalMap[note.note.noteLetter + note.octave] = note.note.accidental;
    });

  return accidentalMap;
}

/**
 * Get accidentals for a stave in a particular measure in a particular beat.
 * @param systems The systems in the score.
 * @param staveIdx The index of the stave.
 * @param measureIdx The index of the measure.
 * @param measureBeat The beat in the measure.
 * @returns The accidentals in the key signature and in the measure.
 */
function getAccidentals(systems: VF.Flow.System[], staveIdx: number, measureIdx: number, measureBeat: VF.Flow.Fraction): EffectiveAccidentals {
  let keySigAccidentals: KeySigAccidentals | undefined = undefined;
  let voiceAccidentals: AccidentalOverrides | undefined = undefined;
  if (systems.length > measureIdx) {
    for (let idx = measureIdx; idx >= 0; idx--) {
      let system = systems[idx];
      let staveParts = (system as any).parts;
      if (staveParts.length > staveIdx && staveParts[staveIdx].stave) {
        let stave = staveParts[staveIdx].stave as VF.Flow.Stave;
        let keySig = stave.getModifiers().find(m => m.getCategory() === (VF.Flow.KeySignature as any).CATEGORY);
        if (keySig) {
          keySigAccidentals = getKeySigAccidentals(keySig as VF.Flow.KeySignature);
          break;
        }
      }
    }

    let voices: VF.Flow.Voice[] | undefined = (systems[measureIdx] as any)?.parts?.flatMap((p: any) => p.voices);
    if (voices) {
      voiceAccidentals = getVoicesAccidentals(voices, measureBeat);
    }
  }

  let accidentalOverrides = voiceAccidentals || {};
  let keySig = keySigAccidentals || {};

  return {
    keySig,
    accidentalOverrides
  };
}


/**
 * Represents a mouse event within the context of a score.
 */
export type ScoreMouseEvent = {
  /**
   * The key signature accidentals and measure accidentals.
   */
  accidentals: EffectiveAccidentals | undefined,

  /**
   * The index of the closest measure.
   */
  measureIdx: number | undefined,

  /**
   * The closest system measure object.
   */
  closestSystemMeasure: VF.Flow.System | undefined,

  /**
   * The index of the stave.
   */
  closestStaveIdx: number | undefined,

  /**
   * The closest stave.
   */
  closestStave: VF.Flow.Stave | undefined,

  /**
   * The closest tickable element.
   */
  closestTickable: TickableAndBeat | undefined,

  /**
   * The closest tickable whose x position is before the mouse x position.
   */
  closestTickableBefore: TickableAndBeat | undefined,

  /**
   * The center line offset in the stave.  If on the space above
   * the center line, 1.  If on the line below -2.
   */
  centerLineOffset: number | undefined,

  /**
   * The pitch based on the center line offset.
   */
  effectivePitch: NoteAndOctave | undefined,

  /**
   * The mouse x position.
   */
  mouseX: number,

  /**
   * The mouse y position.
   */
  mouseY: number
}


/**
 * Gets a score mouse event from a mouse point and series of system measures.
 * @param systems The systems of the score.
 * @param pt The mouse point.
 * @param noteMap A mapping of notes to their properties using vexflow key properties.
 * @param fetchAccidentals Whether or not to fetch accidentals.  This may be a costly 
 * operation since all measures may be searched for key signatures.
 * @returns A mouse event with score information.
 */
export function getScoreMouseEvent(
  systems: VF.Flow.System[],
  pt: Point,
  noteMap: NoteMapping | undefined = NOTE_MAPPING,
  fetchAccidentals: boolean = true): ScoreMouseEvent {

  let sysMeasureResult = getClosestSystemMeasure(systems, pt);

  let closestSystemMeasure: VF.Flow.System | undefined = undefined;
  let measureIdx: number | undefined = undefined;
  let closestStaveIdx: number | undefined = undefined;
  let closestStave: VF.Flow.Stave | undefined = undefined;
  let closestTickable: TickableAndBeat | undefined = undefined;
  let closestTickableBefore: TickableAndBeat | undefined = undefined;
  let centerLineOffset: number | undefined = undefined;
  let effectivePitch: NoteAndOctave | undefined = undefined;
  let accidentals: EffectiveAccidentals | undefined = undefined;

  if (sysMeasureResult) {
    closestSystemMeasure = sysMeasureResult.item;
    measureIdx = sysMeasureResult.idx;

    let staveResult = getClosest(
      (closestSystemMeasure as any).parts.map((p: any) => p.stave as VF.Flow.Stave),
      (stave: VF.Flow.Stave) => Math.abs(pt.y - getStaveCenterY(stave)));

    ({ item: closestStave, idx: closestStaveIdx } =
      (staveResult) ? staveResult : { item: undefined, idx: undefined });

    if (closestStave && closestStaveIdx !== undefined) {
      centerLineOffset = getCenterLineOffset(closestStave, pt);

      if ((closestSystemMeasure as any)?.parts?.length > closestStaveIdx) {
        let voices: VF.Flow.Voice[] = (closestSystemMeasure as any).parts[closestStaveIdx].voices;
        ({ closestTickable, closestTickableBefore } = getClosestTickableResult(voices, pt));

        if (noteMap && closestTickableBefore && centerLineOffset !== undefined) {
          let pitchTick = closestTickableBefore.tickable as any;

          accidentals = fetchAccidentals ?
            getAccidentals(systems, closestStaveIdx, measureIdx, closestTickableBefore.beat) :
            undefined;

          effectivePitch = getNoteAndOctave(noteMap, pitchTick.clef,
            centerLineOffset, pitchTick.octave_shift, accidentals);
        }
      }
    }
  }

  return {
    accidentals,
    measureIdx,
    closestSystemMeasure,
    closestStaveIdx,
    closestStave,
    closestTickable,
    closestTickableBefore,
    centerLineOffset,
    effectivePitch,
    mouseX: pt.x,
    mouseY: pt.y
  };
}
