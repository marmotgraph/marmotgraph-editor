import React from "react";
import injectStyles from "react-jss";

import Lists from "./Search/Lists";
import Instances from "./Search/Instances";

const styles = {
  container: {
    display:"grid",
    gridTemplateColumns:"300px 1fr",
    gridTemplateRows:"1fr",
    overflow:"hidden",
    height:"100%"
  }
};

@injectStyles(styles)
export default class Search extends React.Component{
  constructor(props){
    super(props);
  }

  render = () => {
    const {classes} = this.props;

    return(
      <div className={classes.container}>
        <Lists/>
        <Instances/>
      </div>
    );
  }
}