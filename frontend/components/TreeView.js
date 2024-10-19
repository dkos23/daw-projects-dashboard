import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../styles/TreeView.module.css'; // Import the CSS module

const TreeView = ({ data }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      console.error("Data is not valid or not an array:", data);
      return;
    }

    const svgElement = d3.select(svgRef.current);

    // Get container's width and height dynamically
    const container = svgElement.node().parentNode;
    const width = container.clientWidth || 600;
    // const height = container.clientHeight || 600;
    const height = container.clientHeight || 1000;

    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // Adjust the tree layout dimensions based on available width and height
    const treeLayout = d3
      .tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    const buildTree = (data) => {
      const tree = {};
      data.forEach((item) => {
        const parts = item.path.split(/[\\/]/); // Split by both slashes
        let current = tree;
        parts.forEach((part, index) => {
          if (!current[part]) {
            current[part] = {
              name: part,
              children: {},
            };
          }
          if (index === parts.length - 1) {
            current[part] = { ...current[part], ...item };
          }
          current = current[part].children;
        });
      });

      const convertTreeObjectToArray = (obj) => {
        const keys = Object.keys(obj);
        return keys.map((key) => ({
          ...obj[key],
          children: convertTreeObjectToArray(obj[key].children),
        }));
      };

      return {
        name: 'Root',
        children: convertTreeObjectToArray(tree),
      };
    };

    const treeData = buildTree(data);

    // Set up SVG dimensions
    svgElement
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      // .attr('preserveAspectRatio', 'xMidYMid meet') // Preserve aspect ratio
      .classed(styles['tree-svg'], true); // Apply the tree-svg class

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // Clear any existing nodes and links before re-rendering
    svgElement.selectAll('.link').remove();
    svgElement.selectAll('.node').remove();

    // Add links between nodes
    svgElement
      .selectAll('.link')
      .data(root.links())
      .join('path')
      .classed(styles.link, true) // Use classed() to apply the link class
      .attr(
        'd',
        d3
          .linkHorizontal()
          .x((d) => d.y + margin.left) // Adjust links to use margins
          .y((d) => d.x + margin.top)
      );

    // Add nodes
    const node = svgElement
      .selectAll('.node')
      .data(root.descendants())
      .join('g')
      .classed(styles['node'], true) // Apply the node class from CSS
      .attr('transform', (d) => `translate(${d.y + margin.left},${d.x + margin.top})`); // Adjust nodes to use margins

    node
      .append('circle')
      .attr('r', 5)
      .classed(styles['node-circle'], true); // Apply the node-circle class

    node
      .append('text')
      .attr('dy', '0.31em')
      .attr('x', (d) => (d.children ? -10 : 10))
      .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .classed(styles['node-text'], true) // Apply the node-text class
      .text((d) => d.data.name);
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default TreeView;
