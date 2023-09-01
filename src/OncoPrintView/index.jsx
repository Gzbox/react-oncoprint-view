import React from 'react';
import './fontAwesome/css/font-awesome.min.css';
import Oncoprint from './oncoprint/Oncoprint';

const OncoprintView = (props) => {
  console.log(props);
  return <Oncoprint {...props} />;
};

export default OncoprintView;
