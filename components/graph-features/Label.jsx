const style = {
  display: "inline-block",
  width: '100%',
  textAlign: 'center',
  color: "#808080",
};

const rotateStyles = {
  transform: "rotate(-90deg)",
  maxWidth: 100,
  transformOrigin: "center",
  marginTop: 50
}

const Label = ({text, rotate}) => (
  <div>
    <span style={{...style, ...(rotate ? rotateStyles : {})}}>{text}</span>
  </div>
);

export default Label;