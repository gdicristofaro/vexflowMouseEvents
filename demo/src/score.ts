
import vexflow from "vexflow"


export const getExample = (elementId: any) => {
    const VF = vexflow.Flow;

    // Create an SVG renderer and attach it to the DIV element named "boo".
    var vf = new VF.Factory({ renderer: { elementId, height: 400 } });
    var score = vf.EasyScore() as any;
    var system = vf.System();

    system.addStave({
        voices: [
            score.voice(
                score.notes('C#5/q, B4')
                    .concat(score.beam(score.notes('A4/8, E4, C4, D4')))
            )
        ]
    }).addClef('treble').addTimeSignature('4/4');

    system.addStave({
        voices: [
            score.voice(
                score.notes('C#5/q, B4, B4')
                    .concat(
                        score.tuplet(score.beam(score.notes('A4/8, E4, C4'))))
            )
        ]
    }).addClef('treble').addTimeSignature('4/4');

    vf.draw();
    return score;
}

export const getMinuet = (elementId: string) => {
    let systems: any[] = []
    function concat(a: any, b: any) {
        return a.concat(b);
    }

    var registry = new (vexflow.Flow as any).Registry();
    (vexflow.Flow as any).Registry.enableDefaultRegistry(registry);
    var vf = new vexflow.Flow.Factory({ renderer: { elementId, height: 800, width: 1200 } }) as any;
    var score = vf.EasyScore({ throwOnError: true });

    var voice = score.voice.bind(score);
    var notes = score.notes.bind(score);
    var beam = score.beam.bind(score);

    var x = 120;
    var y = 80;
    function makeSystem(width: any) {
        var system = vf.System({ x: x, y: y, width: width, spaceBetweenStaves: 10 });
        x += width;
        return system;
    }

    // function id(id: any) {
    //   return registry.getElementById(id);
    // }

    score.set({ time: '3/4' });

    /*  Measure 1 */
    var system = makeSystem(220);
    system
        .addStave({
            voices: [
                voice([notes('D5/q[id="m1a"]'), beam(notes('G4/8, A4, B4, C5', { stem: 'up' }))].reduce(concat)),
                voice([vf.TextDynamics({ text: 'p', duration: 'h', dots: 1, line: 9 })]),
            ],
        })
        .addClef('treble')
        .addKeySignature('Bb')
        .addTimeSignature('3/4')
        .setTempo({ name: 'Allegretto', duration: 'h', dots: 1, bpm: 66 }, -30);

    system
        .addStave({ voices: [voice(notes('(G3 B3 D4)/h, A3/q', { clef: 'bass' }))] })
        .addClef('bass')
        .addKeySignature('G')
        .addTimeSignature('3/4');
    system.addConnector('brace');
    system.addConnector('singleRight');
    system.addConnector('singleLeft');
    systems.push(system);
    // id('m1a').addModifier(vf.Fingering({ number: '5' }), 0);

    /*  Measure 2 */
    system = makeSystem(150);
    system.addStave({ voices: [voice(notes('D5/q[id="m2a"], G4[id="m2b"], G4[id="m2c"]'))] });
    system.addStave({ voices: [voice(notes('B3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);
    // id('m2a').addModifier(vf.Articulation({ type: 'a.', position: 'above' }), 0);
    // id('m2b').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);
    // id('m2c').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);

    // vf.Curve({
    //   from: id('m1a'),
    //   to: id('m2a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 40 },
    //       { x: 0, y: 40 },
    //     ],
    //   },
    // });

    /*  Measure 3 */
    system = makeSystem(150);
    system.addStave({
        voices: [voice([notes('E5/q[id="m3a"]'), beam(notes('(C#5 Gb5)/8, D5, En5, F5', { stem: 'down' }))].reduce(concat))],
    });
    // id('m3a').addModifier(vf.Fingering({ number: '3', position: 'above' }), 0);

    system.addStave({ voices: [voice(notes('C4/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    /*  Measure 4 */
    system = makeSystem(150);
    system.addStave({ voices: [voice(notes('G5/q[id="m4a"], G4[id="m4b"], G4[id="m4c"]'))] });

    system.addStave({ voices: [voice(notes('B3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m4a').addModifier(vf.Articulation({ type: 'a.', position: 'above' }), 0);
    // id('m4b').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);
    // id('m4c').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);

    // vf.Curve({
    //   from: id('m3a'),
    //   to: id('m4a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 20 },
    //       { x: 0, y: 20 },
    //     ],
    //   },
    // });

    /*  Measure 5 */
    system = makeSystem(150);
    system.addStave({
        voices: [voice([notes('C5/q[id="m5a"]'), beam(notes('D5/8, C5, B4, A4', { stem: 'down' }))].reduce(concat))],
    });
    // id('m5a').addModifier(vf.Fingering({ number: '4', position: 'above' }), 0);

    system.addStave({ voices: [voice(notes('A3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    /*  Measure 6 */
    system = makeSystem(150);
    system.addStave({
        voices: [voice([notes('B4/q'), beam(notes('C5/8, B4, A4, G4[id="m6a"]', { stem: 'up' }))].reduce(concat))],
    });

    system.addStave({ voices: [voice(notes('G3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // vf.Curve({
    //   from: id('m5a'),
    //   to: id('m6a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 20 },
    //       { x: 0, y: 20 },
    //     ],
    //     invert: true,
    //     position_end: 'nearTop',
    //     y_shift: 20,
    //   },
    // });

    /*  Measure 7 (New system) */
    x = 20;
    y += 230;

    system = makeSystem(220);
    system
        .addStave({
            voices: [
                voice([notes('F4/q[id="m7a"]'), beam(notes('G4/8[id="m7b"], A4, B4, G4', { stem: 'up' }))].reduce(concat)),
            ],
        })
        .addClef('treble')
        .addKeySignature('G');

    system
        .addStave({ voices: [voice(notes('D4/q, B3[id="m7c"], G3', { clef: 'bass' }))] })
        .addClef('bass')
        .addKeySignature('G');
    system.addConnector('brace');
    system.addConnector('singleRight');
    system.addConnector('singleLeft');
    systems.push(system);

    // id('m7a').addModifier(vf.Fingering({ number: '2', position: 'below' }), 0);
    // id('m7b').addModifier(vf.Fingering({ number: '1' }), 0);
    // id('m7c').addModifier(vf.Fingering({ number: '3', position: 'above' }), 0);

    /*  Measure 8 */
    system = makeSystem(180);
    var grace = vf.GraceNote({ keys: ['d/3'], clef: 'bass', duration: '8', slash: true });

    system.addStave({ voices: [voice(notes('A4/h.[id="m8c"]'))] });
    system.addStave({
        voices: [
            score
                .set({ clef: 'bass' })
                .voice(
                    [notes('D4/q[id="m8a"]'), beam(notes('D3/8, C4, B3[id="m8b"], A3', { stem: 'down' }))].reduce(concat)
                ),
        ],
    });
    system.addConnector('singleRight');
    systems.push(system);


    // id('m8b').addModifier(vf.Fingering({ number: '1', position: 'above' }), 0);
    // id('m8c').addModifier(vf.GraceNoteGroup({ notes: [grace] }), 0);

    // vf.Curve({
    //   from: id('m7a'),
    //   to: id('m8c'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 20 },
    //       { x: 0, y: 20 },
    //     ],
    //     invert: true,
    //     position: 'nearTop',
    //     position_end: 'nearTop',
    //   },
    // });

    // vf.StaveTie({ from: grace, to: id('m8c') });

    /*  Measure 9 */
    system = makeSystem(180);
    system.addStave({
        voices: [
            score
                .set({ clef: 'treble' })
                .voice([notes('D5/q[id="m9a"]'), beam(notes('G4/8, A4, B4, C5', { stem: 'up' }))].reduce(concat)),
        ],
    });

    system.addStave({ voices: [voice(notes('B3/h, A3/q', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m9a').addModifier(vf.Fingering({ number: '5' }), 0);

    /*  Measure 10 */
    system = makeSystem(170);
    system.addStave({ voices: [voice(notes('D5/q[id="m10a"], G4[id="m10b"], G4[id="m10c"]'))] });
    system.addStave({ voices: [voice(notes('G3/q[id="m10d"], B3, G3', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m10a').addModifier(vf.Articulation({ type: 'a.', position: 'above' }), 0);
    // id('m10b').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);
    // id('m10c').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);
    // id('m10d').addModifier(vf.Fingering({ number: '4' }), 0);

    // vf.Curve({
    //   from: id('m9a'),
    //   to: id('m10a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 40 },
    //       { x: 0, y: 40 },
    //     ],
    //   },
    // });

    /*  Measure 11 */
    system = makeSystem(150);
    system.addStave({
        voices: [voice([notes('E5/q[id="m11a"]'), beam(notes('C5/8, D5, E5, F5', { stem: 'down' }))].reduce(concat))],
    });
    // id('m11a').addModifier(vf.Fingering({ number: '3', position: 'above' }), 0);

    system.addStave({ voices: [voice(notes('C4/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    /*  Measure 12 */
    system = makeSystem(170);
    system.addStave({ voices: [voice(notes('G5/q[id="m12a"], G4[id="m12b"], G4[id="m12c"]'))] });

    system.addStave({
        voices: [
            score
                .set({ clef: 'bass' })
                .voice(
                    [notes('B3/q[id="m12d"]'), beam(notes('C4/8, B3, A3, G3[id="m12e"]', { stem: 'down' }))].reduce(concat)
                ),
        ],
    });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m12a').addModifier(vf.Articulation({ type: 'a.', position: 'above' }), 0);
    // id('m12b').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);
    // id('m12c').addModifier(vf.Articulation({ type: 'a.', position: 'below' }), 0);

    // id('m12d').addModifier(vf.Fingering({ number: '2', position: 'above' }), 0);
    // id('m12e').addModifier(vf.Fingering({ number: '4', position: 'above' }), 0);

    // vf.Curve({
    //   from: id('m11a'),
    //   to: id('m12a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 20 },
    //       { x: 0, y: 20 },
    //     ],
    //   },
    // });

    /*  Measure 13 (New system) */
    x = 20;
    y += 230;

    system = makeSystem(220);
    system
        .addStave({
            voices: [
                score
                    .set({ clef: 'treble' })
                    .voice([notes('c5/q[id="m13a"]'), beam(notes('d5/8, c5, b4, a4', { stem: 'down' }))].reduce(concat)),
            ],
        })
        .addClef('treble')
        .addKeySignature('G');

    system
        .addStave({ voices: [voice(notes('a3/h[id="m13b"], f3/q[id="m13c"]', { clef: 'bass' }))] })
        .addClef('bass')
        .addKeySignature('G');

    system.addConnector('brace');
    system.addConnector('singleRight');
    system.addConnector('singleLeft');
    systems.push(system);

    // id('m13a').addModifier(vf.Fingering({ number: '4', position: 'above' }), 0);
    // id('m13b').addModifier(vf.Fingering({ number: '1' }), 0);
    // id('m13c').addModifier(vf.Fingering({ number: '3', position: 'above' }), 0);

    /*  Measure 14 */
    system = makeSystem(180);
    system.addStave({
        voices: [
            score
                .set({ clef: 'treble' })
                .voice([notes('B4/q'), beam(notes('C5/8, b4, a4, g4', { stem: 'up' }))].reduce(concat)),
        ],
    });

    system.addStave({ voices: [voice(notes('g3/h[id="m14a"], b3/q[id="m14b"]', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m14a').addModifier(vf.Fingering({ number: '2' }), 0);
    // id('m14b').addModifier(vf.Fingering({ number: '1' }), 0);

    /*  Measure 15 */
    system = makeSystem(180);
    system.addStave({
        voices: [
            score
                .set({ clef: 'treble' })
                .voice([notes('a4/q'), beam(notes('b4/8, a4, g4, f4[id="m15a"]', { stem: 'up' }))].reduce(concat)),
        ],
    });

    system.addStave({ voices: [voice(notes('c4/q[id="m15b"], d4, d3', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m15a').addModifier(vf.Fingering({ number: '2' }), 0);
    // id('m15b').addModifier(vf.Fingering({ number: '2' }), 0);

    /*  Measure 16 */
    system = makeSystem(130);
    system
        .addStave({
            voices: [score.set({ clef: 'treble' }).voice([notes('g4/h.[id="m16a"]')].reduce(concat))],
        })
        .setEndBarType(vexflow.Flow.Barline.type.REPEAT_END);

    system
        .addStave({ voices: [voice(notes('g3/h[id="m16b"], g2/q', { clef: 'bass' }))] })
        .setEndBarType(vexflow.Flow.Barline.type.REPEAT_END);
    system.addConnector('boldDoubleRight');
    systems.push(system);

    // id('m16a').addModifier(vf.Fingering({ number: '1' }), 0);
    // id('m16b').addModifier(vf.Fingering({ number: '1' }), 0);

    // vf.Curve({
    //   from: id('m13a'),
    //   to: id('m16a'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 50 },
    //       { x: 0, y: 20 },
    //     ],
    //     invert: true,
    //     position_end: 'nearTop',
    //   },
    // });

    /* Measure 17 */
    system = makeSystem(180);
    system
        .addStave({
            voices: [
                score
                    .set({ clef: 'treble' })
                    .voice([notes('b5/q[id="m17a"]'), beam(notes('g5/8, a5, b5, g5', { stem: 'down' }))].reduce(concat)),
                voice([vf.TextDynamics({ text: 'mf', duration: 'h', dots: 1, line: 10 })]),
            ],
        })
        .setBegBarType(vexflow.Flow.Barline.type.REPEAT_BEGIN);

    system
        .addStave({ voices: [voice(notes('g3/h.', { clef: 'bass' }))] })
        .setBegBarType(vexflow.Flow.Barline.type.REPEAT_BEGIN);

    system.addConnector('boldDoubleLeft');
    system.addConnector('singleRight');
    systems.push(system);

    // id('m17a').addModifier(vf.Fingering({ number: '5', position: 'above' }), 0);

    /* Measure 18 */
    system = makeSystem(180);
    system.addStave({
        voices: [
            score
                .set({ clef: 'treble' })
                .voice(
                    [notes('a5/q[id="m18a"]'), beam(notes('d5/8, e5, f5, d5[id="m18b"]', { stem: 'down' }))].reduce(concat)
                ),
        ],
    });

    system.addStave({ voices: [voice(notes('f3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
    systems.push(system);

    // id('m18a').addModifier(vf.Fingering({ number: '4', position: 'above' }), 0);

    // vf.Curve({
    //   from: id('m17a'),
    //   to: id('m18b'),
    //   options: {
    //     cps: [
    //       { x: 0, y: 20 },
    //       { x: 0, y: 30 },
    //     ],
    //   },
    // });

    /* Done */
    //(vexflow.Flow as any).Registry.disableDefaultRegistry();
    vf.draw();
    return systems;
}
