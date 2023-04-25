/*
 * Copyright 2018 - 2021 Swiss Federal Institute of Technology Lausanne (EPFL)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This open source software code was developed in part or in whole in the
 * Human Brain Project, funded from the European Union's Horizon 2020
 * Framework Programme for Research and Innovation under
 * Specific Grant Agreements No. 720270, No. 785907, and No. 945539
 * (Human Brain Project SGA1, SGA2 and SGA3).
 *
 */

import React, { useEffect, useState, useRef } from "react";
import { createUseStyles } from "react-jss";
import { observer } from "mobx-react-lite";
import { ForceGraph2D } from "react-force-graph";
import debounce from "lodash/debounce";
import Color from "color";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocation, useNavigate } from "react-router-dom";

import useStores from "../../../Hooks/useStores";

const useStyles = createUseStyles({
  graph: {
    width: "100%",
    height: "100%",
    borderRadius: "4px",
    overflow: "hidden",
    zIndex: "2",
    position: "relative"
  },
  slider: {
    width: "5%",
    height: "20%",
    position: "absolute",
    bottom: "10px",
    right: "0px"
  },
  capture: {
    position: "absolute",
    top: "10px",
    right: "10px"
  },
  settings: {
    position: "absolute",
    top: "20px",
    right: "20px"
  },
  edit: {
    position: "absolute",
    top: "20px",
    right: "74px"
  }
});

const GraphViz = observer(() => {

  const wrapperRef = useRef();
  const graphRef = useRef();

  const classes = useStyles();

  const { appStore, graphStore, authStore } = useStores();

  const location = useLocation();
  const navigate = useNavigate();

  const [dimensions, setDimensions] = useState({width: 0, height: 0});

  useEffect(() => {
    const updateDimensions = debounce(() => {
      if(wrapperRef.current) {
        setDimensions({width: wrapperRef.current.offsetWidth, height: wrapperRef.current.offsetHeight});
      }
    }, 250);
    updateDimensions();
    graphRef.current && graphRef.current.zoom(Math.round(Math.min(window.innerWidth / 365, window.innerHeight / 205)));
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  const handleNodeClick = node => {
    if (node.isGroup) {
      graphStore.setGrouping(node, false);
    } else if (node.id !== graphStore.mainId) {
      graphStore.reset();
      if(node.space && node.space !== appStore.currentSpace.id) {
        const space = authStore.getSpaceInfo(node.space);
        if(space.permissions.canRead) {
          appStore.switchSpace(location, navigate, node.space);
          navigate(`/instances/${node.id}/graph`);
        }
      } else {
        navigate(`/instances/${node.id}/graph`);
      }
    }
  };

  const handleNodeHover = node => graphStore.setHighlightNodeConnections(node, true);

  const getNodeName = node => {
    if(node.isGroup) {
      return `Group of ${node.types.length > 1?("(" + node.name + ")"):node.name} (${node.nodes.length})`;
    }
    return `(${graphStore.groups[node.groupId] && graphStore.groups[node.groupId].name}) ${node.name}`;
  };

  const getNodeLabel = node =>  {
    const nodeName = getNodeName(node);
    let space = "";
    if(node.space && node.space !== appStore.currentSpace.id) {
      space = `(Space: ${node.space})`;
    }
    return `${nodeName} ${space}`;
  };

  const getNodeAutoColorBy = node => node.color;

  const wrapText = (context, text, x, y, maxWidth, lineHeight, node) => {
    if (node.labelLines === undefined) {
      let words = text.split(/( |_|-|\.)/gi); //NOSONAR
      let line = "";
      let lines = [];

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n];
        let metrics = context.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n];
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      node.labelLines = lines;
    }

    y = y - (lineHeight * (node.labelLines.length - 2) / 2);
    node.labelLines.forEach(line => {
      context.fillText(line, x, y);
      y += lineHeight;
    });
  };

  const getNodeCanvasObject = (node, ctx, scale) => {
    ctx.beginPath();
    if (node.isGroup) {
      ctx.rect(node.x - 6, node.y - 6, 12, 12);
    } else {
      ctx.arc(node.x, node.y, node.isMainNode ? 10 : 6, 0, 2 * Math.PI);
    }

    if (graphStore.highlightedNode) {
      if (!node.highlighted) {
        ctx.globalAlpha = 0.1;
      }
    }
    const color = node.color;
    ctx.strokeStyle = new Color(color).darken(0.25).hex();
    ctx.fillStyle = color;

    if (node.isMainNode) {
      ctx.setLineDash([2, 0.5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.fill();
    if (scale > 3) {
      ctx.beginPath();
      ctx.font = "1.2px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "black";

      const label = getNodeName(node);

      wrapText(ctx, label, node.x, node.y, 10, 1.3, node);
    }

    ctx.globalAlpha = 1;
  };

  const getLinkColor = link => {
    if (graphStore.highlightedNode) {
      if (link.target === graphStore.highlightedNode) {
        return new Color("#f39c12").alpha(1).rgb();
      } else if (link.source === graphStore.highlightedNode) {
        return new Color("#1abc9c").alpha(1).rgb();
      } else {
        return new Color("#ccc").alpha(0.1).rgb();
      }
    } else {
      return new Color("#ccc").alpha(1).rgb();
    }
  };

  const getLinkWidth = link => (graphStore.highlightedNode && link.highlighted)?2:1;

  const handleCapture = e => {
    e.target.href = wrapperRef.current && wrapperRef.current.querySelector("canvas").toDataURL("image/png");
    e.target.download = "test.png";
  };
  
  return (
    <div className={classes.graph} ref={wrapperRef}>
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={{nodes: graphStore.graphDataNodes, links: graphStore.graphDataLinks}}
        nodeAutoColorBy={getNodeAutoColorBy}
        nodeLabel={getNodeLabel}
        nodeCanvasObject={getNodeCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTime={4000}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        nodeRelSize={7}
        linkDirectionalArrowLength={3}
      />
      <button className={`${classes.capture} btn btn-primary`} onClick={handleCapture} alt="capture"><FontAwesomeIcon icon="camera" /></button>
    </div>
  );
});
GraphViz.displayName = "GraphViz";

export default GraphViz;