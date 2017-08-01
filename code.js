const server="192.168.16.140:8087";
const fronius="fronius.0.powerflow.P_PV";
const width=900, height=300,padding=25;
const x=d3.scaleLinear().range([padding,width-padding])
  .domain([0,10000]);

const xAxis=d3.axisBottom().scale(x).tickFormat(function (d) {
  return x.tickFormat(12,d3.format(",d"))(d)})

const svg=d3.select("#graph").append("svg")
  .attr("width",width)
  .attr("height",height);

svg.append("g")
  .attr("class","axis")
  .attr("transform","translate(0,80)")
  .call(xAxis)

const bar=svg.append("rect")
  .attr("x", x(0))
  .attr("y",padding)
  .attr("height",50)
  .attr("fill","yellow")
  .attr("stroke","blue")

const text=svg.append("text")
  .attr("class","textval")
  .attr("x",padding+5)
  .attr("y",padding+25)

setInterval(update,10000)
update()

async function update(){
  const result=await fetch(`http://${server}/get/${fronius}`)
  const power=await result.json()
  bar.attr("width", x(power.val)-x(0))
  text.text(`${power.val} Watt`)
}
