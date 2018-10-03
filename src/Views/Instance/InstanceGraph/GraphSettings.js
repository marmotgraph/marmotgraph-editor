import React from "react";
import {observer} from "mobx-react";
import injectStyles from "react-jss";
import MultiToggle from "../../../Components/MultiToggle";
import Color from "color";
import {isString, sortBy} from "lodash";
import {Glyphicon} from "react-bootstrap";
import { Scrollbars } from "react-custom-scrollbars";

import routerStore from "../../../Stores/RouterStore";
import graphStore from "../../../Stores/GraphStore";

const styles = {
  container:{
    height:"100%"
  },
  nodeType:{
    position:"relative",
    height:"45px",
    padding:"0 10px 0 35px",
    "&:nth-child(odd)":{
      background:"var(--bg--color-ui-contrast3)"
    },
    overflow:"hidden",
    "&.expanded":{
      height:"auto"
    },
    "&.disabled":{
      opacity:"0.2",
      display:"none"
    }
  },
  nodeTypeActions:{
    position:"absolute",
    right:"10px",
    top:"10px",
    fontSize:"1.25em"
  },
  nodeTypeLabel:{
    lineHeight:"45px",
    paddingLeft:20,
    color:"var(--ft-color-normal)",
    cursor:"pointer",
    "&:hover":{
      color:"var(--ft-color-loud)",
    }
  },
  legend:{
    position:"absolute",
    width:"20px",
    height:"20px",
    left:30,
    top:13,
    borderRadius:"50%",
    background:"white",
    border:"2px solid gray",
    zIndex:2
  },
  nodeTypeInstances:{
    paddingBottom:10
  },
  nodeTypeInstance:{
    padding:"5px 0",
    position:"relative",
    cursor:"pointer",
    color:"var(--ft-color-normal)",
    "&:hover":{
      color:"var(--ft-color-loud)",
    },
    "&::before":{
      content:"''",
      display:"block",
      position:"absolute",
      left:-23,
      top:-15,
      height:32,
      width:1,
      borderLeft:"1px dashed #bdc3c7"
    },
    "&::after":{
      content:"''",
      display:"block",
      position:"absolute",
      left:-22,
      top:16,
      width:"17px",
      height:1,
      borderBottom:"1px dashed #bdc3c7"
    }
  },
  expandButton:{
    color:"#bdc3c7",
    position:"absolute",
    top:16,
    left:6
  }
};

@injectStyles(styles)
@observer
export default class GraphSettings extends React.Component{
  handleChange(nodeType, state){
    graphStore.setTypeState(nodeType, state);
  }

  handleNodeHover(node){
    graphStore.hlNode(node);
  }

  handleNodeClick(node){
    routerStore.history.push("/instance/graph/"+node.id);
    graphStore.reset();
  }

  handleExpandClick(nodeType){
    graphStore.toggleType(nodeType);
  }

  render(){
    const {classes} = this.props;
    return (
      <div className={classes.container}>
        <Scrollbars autoHide>
          {graphStore.isFetched ?
            <div className={classes.nodeList}>
              {graphStore.nodeTypeWhitelist.concat().sort().map(nodeType => {
                let nodesOfType = graphStore.findNodesByType(nodeType);
                let isDisabled = graphStore.typeStates.get(nodeType) === "none";
                let isExpanded = graphStore.expandedTypes.indexOf(nodeType) !== -1;
                let isGrouped = graphStore.typeStates.get(nodeType) === "group";
                return(
                  <div className={`${classes.nodeType}${
                    isDisabled? " disabled":""
                  }${
                    isExpanded? " expanded":""
                  }`} key={nodeType}>
                    <Glyphicon glyph={isExpanded? "chevron-down": "chevron-right"} className={classes.expandButton} onClick={this.handleExpandClick.bind(this, nodeType)}/>
                    <div className={classes.legend} style={{borderRadius: isGrouped? "0": "50%", background:graphStore.colorScheme[nodeType], borderColor:new Color(graphStore.colorScheme[nodeType]).darken(0.25).hex()}}/>
                    <div className={classes.nodeTypeLabel} onMouseOver={
                      isGrouped? this.handleNodeHover.bind(this, graphStore.groupNodes.get(nodeType))
                        : undefined} onMouseOut={this.handleNodeHover.bind(this, null)}>
                      {nodeType.replace("http://hbp.eu/minds#","")}
                    </div>
                    <div className={classes.nodeTypeActions}>
                      {!isDisabled?
                        <MultiToggle selectedValue={graphStore.typeStates.get(nodeType)} onChange={this.handleChange.bind(this, nodeType)}>
                          {graphStore.groupNodes.has(nodeType) && <MultiToggle.Toggle color={"var(--ft-color-loud)"} icon={"compress"} value="group"/>}
                          <MultiToggle.Toggle color={"var(--ft-color-loud)"} icon={graphStore.groupNodes.has(nodeType)?"expand-arrows-alt":"eye"} value="show"/>
                          <MultiToggle.Toggle color={"var(--ft-color-loud)"} icon={"eye-slash"} value="hide"/>
                        </MultiToggle>
                        :null}
                    </div>
                    {isExpanded?
                      <div className={classes.nodeTypeInstances}>
                        {sortBy(nodesOfType, ["title"]).map(node => {
                          return(
                            <div
                              onMouseOver={this.handleNodeHover.bind(this, node)}
                              onMouseOut={this.handleNodeHover.bind(this, null)}
                              onClick={this.handleNodeClick.bind(this, node)}
                              key={node.id}
                              className={classes.nodeTypeInstance}>
                              {isString(node.title)?node.title:node.id}
                            </div>
                          );
                        })}
                      </div>
                      :null}
                  </div>
                );
              })}
            </div>
            :null}
        </Scrollbars>
      </div>
    );
  }
}