class StatsChart {
  constructor() {
    this.flowColor = "#FF4BA5";
    this.energyColor = "#8B4B9F";
    this.padding = {
      left: 50,
      right: 80,
      top: 30,
      bottom: 40
    };
  }

  create(container, stats) {
    const width = Math.min(container.clientWidth - 40, 1000);
    const height = Math.min(width * 0.35, 250);

    const svg = this.createSVG(width, height);
    this.drawAxes(svg, width, height);
    this.plotData(svg, stats, width, height);
    this.addLegend(svg, width);
    
    container.appendChild(svg);
    return svg;
  }

  createSVG(width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.backgroundColor = "#fff";
    return svg;
  }

  drawAxes(svg, width, height) {
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", this.padding.left);
    xAxis.setAttribute("y1", height - this.padding.bottom);
    xAxis.setAttribute("x2", width - this.padding.right);
    xAxis.setAttribute("y2", height - this.padding.bottom);
    xAxis.setAttribute("stroke", "#000");
    xAxis.setAttribute("stroke-width", "2");

    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", this.padding.left);
    yAxis.setAttribute("y1", this.padding.top);
    yAxis.setAttribute("x2", this.padding.left);
    yAxis.setAttribute("y2", height - this.padding.bottom);
    yAxis.setAttribute("stroke", "#000");
    yAxis.setAttribute("stroke-width", "2");

    svg.appendChild(xAxis);
    svg.appendChild(yAxis);
  }

  plotData(svg, stats, width, height) {
    // Calculate time range
    const timestamps = stats.map(stat => new Date(stat.timestamp));
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeRange = maxTime - minTime;

    // Add energy line and points
    this.plotMetric(svg, stats, width, height, 'energy', timeRange, minTime);

    // Add flow line and points  
    this.plotMetric(svg, stats, width, height, 'flow', timeRange, minTime);
  }

  plotMetric(svg, stats, width, height, metric, timeRange, minTime) {
    const color = metric === 'energy' ? this.energyColor : this.flowColor;
    
    // Create line
    const polyline = this.createPolyline(stats, width, height, metric, timeRange, minTime, color);
    svg.appendChild(polyline);

    // Add points
    stats.forEach(stat => {
      const x = this.getTimeX(new Date(stat.timestamp), minTime, timeRange, width);
      const y = this.getY(stat[metric], height);

      const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      point.setAttribute("cx", x);
      point.setAttribute("cy", y);
      point.setAttribute("r", "3");
      point.setAttribute("fill", color);
      svg.appendChild(point);
    });
  }

  createPolyline(stats, width, height, metric, timeRange, minTime, color) {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const points = stats
      .map(stat => {
        const x = this.getTimeX(new Date(stat.timestamp), minTime, timeRange, width);
        const y = this.getY(stat[metric], height);
        return `${x},${y}`;
      })
      .join(" ");

    polyline.setAttribute("points", points);
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", color);
    polyline.setAttribute("stroke-width", "2");

    return polyline;
  }

  getTimeX(timestamp, minTime, timeRange, width) {
    const timeOffset = timestamp - minTime;
    return this.padding.left + (width - this.padding.left - this.padding.right) * (timeOffset / timeRange);
  }

  getY(value, height) {
    return height - (this.padding.bottom + (height - this.padding.top - this.padding.bottom) * value);
  }

  addLegend(svg, width) {
    const legend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const items = [
      { color: this.energyColor, label: "Energy" },
      { color: this.flowColor, label: "Flow" }
    ];

    items.forEach((item, i) => {
      const y = this.padding.top + i * 20;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", width - this.padding.right + 10);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width - this.padding.right + 30);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", item.color);
      line.setAttribute("stroke-width", "2");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", width - this.padding.right + 35);
      text.setAttribute("y", y + 4);
      text.setAttribute("font-size", "12");
      text.textContent = item.label;

      legend.appendChild(line);
      legend.appendChild(text);
    });

    svg.appendChild(legend);
  }
}