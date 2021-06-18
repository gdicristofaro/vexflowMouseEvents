import React from "react";
import {getNoteMap, getScoreMouseEvent, ScoreMouseEvent} from "vexflow-mouse-events"
import { getMinuet } from "./score";

const eventDemoId = "eventDemo";

export default class App extends React.Component<any, {mouseEvent: any}> {
  myRef: any = null;
  systems: any[] = []

  constructor(props: any) {
    super(props);
    this.myRef = React.createRef();
  }

  componentDidMount() {
    this.systems = getMinuet(eventDemoId);
  }


  onClick(e: any, systems: any[]) {
    let rect = this.myRef.current.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    let pt = { x: mouseX, y: mouseY };
    let evt = getScoreMouseEvent(systems, pt, getNoteMap(), true);
    this.setState({mouseEvent: evt});
  }

  render() {
    let mouseEvent : ScoreMouseEvent | undefined = (this?.state as any)?.mouseEvent;

    return (
      <div style={{width: '100vw', height: '100vh', overflow: 'auto', margin: 0, padding: 0}}>
        <div style={{marginBottom: '300px'}}>
          <div id={eventDemoId}
            style={{paddingLeft: '30px', paddingTop: '30px'}}
            ref={this.myRef}
            onClick={(e) => this.onClick(e, this.systems)}
          />
        </div>
        {mouseEvent &&
          <div style={{
            position: 'absolute', 
            bottom: '25px',
            right: '25px', 
            padding: '0px 5px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #ddd',
            boxShadow: '3px 5px 3px #888888'
          }}>
            {[
              ["Accidentals", JSON.stringify(mouseEvent.accidentals)], 
              ["Centerline Offset", mouseEvent.centerLineOffset],
              ["Closest Staves Index", mouseEvent.closestStaveIdx],
              ["Tickable Before Beat", mouseEvent.closestTickableBefore?.beat],
              ["Effective Pitch", JSON.stringify(mouseEvent.effectivePitch)],
              ["Measure Index", mouseEvent.measureIdx],
              ["Mouse X", mouseEvent.mouseX],
              ["Mouse Y", mouseEvent.mouseY]
            ]
            .map(kv => (<p key={kv[0]?.toString()}>{kv[0]}: {kv[1]?.toString()}</p>))
          }
          </div>
        }
      </div>
    )
  }
}