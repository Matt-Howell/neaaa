const STROKE = 1;

const LineChart = ({ data, height, width, horizontalGuides: numberOfSearchesOnY, precision, preview }) => {
  const FONT_SIZE = width / 50;
  const maximumXValue = Math.max(...data.map(e => e.x));
  const maximumYValue = Math.max(...data.map(e => e.y));

  const digits = parseFloat(maximumYValue.toString()).toFixed(precision).length + 1;

  const padding = (FONT_SIZE + digits) * 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map(element => {
      const x = (element.x / maximumXValue) * chartWidth + padding;
      const y =
        chartHeight - (element.y / maximumYValue) * chartHeight + padding;
      return `${x},${y}`;
    }).join(" ");

  const Axis = ({ points }) => (
    <polyline fill="none" stroke="#ccc" strokeWidth=".5" points={points} />
  );

  const XAxis = () => (
    <Axis
      points={`${padding},${height - padding} ${width - padding},${height -
        padding}`}
    />
  );

  const YAxis = () => (
    <Axis points={`${padding},${padding} ${padding},${height - padding}`} />
  );

  const LabelsXAxis = () => {
    const y = height - padding + FONT_SIZE * 2;
  
    return data.map((element, index) => {
      if (index % Math.ceil(data.length / 3) !== 0) {
        return null;
      } // limits months to be just 3 on X
  
      const x = (element.x / maximumXValue) * chartWidth + padding - FONT_SIZE / 2;
      return (
        <text
          key={index}
          x={x}
          y={y}
          style={{
            fill: "#808080",
            fontSize: FONT_SIZE,
            fontFamily: "Helvetica"
          }}
        >
          {element.label}
        </text>
      );
    });
  };

  const LabelsYAxis = () => {
    const PARTS = numberOfSearchesOnY;
    return new Array(6).fill(0).map((_, index) => {
      const x = FONT_SIZE;
      const ratio = index / numberOfSearchesOnY;

      const yCoordinate = chartHeight - chartHeight * ratio + padding + FONT_SIZE / 2;
      return (
        <text
          key={index}
          x={x}
          y={yCoordinate}
          style={{
            fill: "#808080",
            fontSize: FONT_SIZE,
            fontFamily: "Helvetica"
          }}
        >
          {parseInt(maximumYValue * (index / PARTS))}
        </text>
      );
    });
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
    >
      {!preview?<XAxis />:null}
      {!preview?<LabelsXAxis />:null}
      {!preview?<YAxis />:null}
      {!preview?<LabelsYAxis />:null}

      <polyline
        fill="none"
        stroke="#0074d9"
        strokeWidth={STROKE}
        points={points}
      />
    </svg>
  );
};

export default LineChart;