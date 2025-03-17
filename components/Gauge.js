// components/Gauge.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Circle, Line, Text as SvgText } from 'react-native-svg';

const Gauge = ({ value, maxValue, proposedvalue}) => {
  const size = 250;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const angle = (proposedvalue / maxValue) * 180;
  const fill = circumference;

  // Function to interpolate colors from green (min) to red (max)
  const interpolateColor = (proposedvalue, maxValue) => {
    const ratio = (proposedvalue - value) / (maxValue - value);
    const r = Math.round(255 * ratio);
    const g = Math.round(255 * (1 - ratio));
    return `rgb(${r},${g},0)`;
  };
  

  // Calculate line end points within the semi-circle, adjusting angle to start from right (min) to left (max)
  const adjustedAngle = 180 - angle;
  const lineX2 = size / 2 + radius * Math.cos(Math.PI * adjustedAngle / 180);
  const lineY2 = size / 2 - radius * Math.sin(Math.PI * adjustedAngle / 180);

  // Get the interpolated color
  const strokeColor = interpolateColor(proposedvalue, maxValue);

 // Determine the deal text based on value
const getDealText = (proposedvalue, value, maxValue) => {
    const range = maxValue - value;
    const greatThreshold = value + 0.4 * range;
    const fairThreshold = value + 0.85 * range;
  
    if (proposedvalue <= greatThreshold) {
      return 'Great Deal';
    } else if (proposedvalue <= fairThreshold) {
      return 'Fair Deal';
    } else {
      return 'Bad Deal';
    }
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size / 2}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#d3d3d3"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - fill}
        />
        <Line
          x1={size / 2}
          y1={size / 2}
          x2={lineX2}
          y2={lineY2}
          stroke="black"
          strokeWidth={2}
        />
        <SvgText
          x={size / 2}
          y={size / 2 - 20}
          fill="black"
          fontSize="20"
          fontWeight="bold"
          textAnchor="middle"
        >
          {getDealText(proposedvalue, value, maxValue)}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});

export default Gauge;
