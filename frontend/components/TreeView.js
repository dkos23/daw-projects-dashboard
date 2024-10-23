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

    // Margin calculation with dynamic right margin
    let maxLabelLength = 0;
    data.forEach(item => {
      const parts = item.path.split(/[\\/]/);
      parts.forEach(part => {
        if (part.length > maxLabelLength) {
          maxLabelLength = part.length;
        }
      });
    });

    // const margin = { top: 10, right: 10, bottom: 20, left: 20 };
    const margin = { top: 20, right: maxLabelLength * 7 - 60, bottom: 20, left: 20 };

    // Adjust the tree layout dimensions based on available width and height
    const treeLayout = d3
      .tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

    let newdata = [];
    const buildTree = (data) => {
      const tree = {};

      const savedStartPath = localStorage.getItem('startPath');
      const lastFolder = savedStartPath.split(/[\\/]/).pop();

      data.forEach((item) => {
        const parts = item.path.split(/[\\/]/); // Split the path into parts
        const lastFolderIndex = parts.indexOf(lastFolder); // Find the index of the last folder

        if (lastFolderIndex !== -1) {
          const relevantParts = parts.slice(lastFolderIndex); // Get everything from the last folder onwards

          // Push the transformed object into newdata
          newdata.push({
            ...item,
            path: relevantParts.join('\\'), // Rebuild the path from the relevant parts
          });
        }
      });

      newdata.forEach((item) => {
        const parts = item.path.split(/[\\/]/); // Split by slashes again for tree building
        let current = tree;

        // Traverse through the path to build the tree
        parts.forEach((part, index) => {
          if (!current[part]) {
            current[part] = {
              name: part,
              children: {},
            };
          }
          
          // Attach the file data to the last part (file node)
          if (index === parts.length - 1) {
            current[part] = { ...current[part], ...item };
          }

          current = current[part].children;
        });
      });

      const convertTreeObjectToArray = (obj) => {
        if (!obj || typeof obj !== 'object') {
          return [];
        }
        const keys = Object.keys(obj);
        return keys.map((key) => ({
          ...obj[key],
          children: convertTreeObjectToArray(obj[key].children),
        }));
      };

      return {
        name: "...",
        children: convertTreeObjectToArray(tree),
      };
    };

    const treeData = buildTree(data);

    // Clear any existing elements before re-rendering
    svgElement.selectAll('*').remove();

    const root = d3.hierarchy(treeData);
    treeLayout(root);

    const nodes = root.descendants();
    const treeHeight = nodes.length * 30;

    // Create a container group that will handle panning and zooming
    const g = svgElement
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up SVG dimensions
    svgElement
      .attr('width', width)
      .attr('height',  Math.max(treeHeight, height))
      .attr('viewBox', [0, 0, width, height])
      // .attr('viewBox', [0, 0, width + margin.right, Math.max(treeHeight, height)])
      // .attr('preserveAspectRatio', 'xMidYMid meet') // Preserve aspect ratio
      .classed(styles['tree-svg'], true); // Apply the tree-svg class


    // Clear any existing nodes and links before re-rendering
    svgElement.selectAll('.link').remove();
    svgElement.selectAll('.node').remove();

    // Add links between nodes
    g
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
    const node = g
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

      // Enable zoom and pan behavior
      const zoom = d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform); // Apply zoom/pan transformation to the group
      });

      svgElement.call(zoom);
  }, [data]);


  return <svg ref={svgRef}></svg>;
};

export default TreeView;
