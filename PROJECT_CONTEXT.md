# Interactive Street Modeling - Project Context

## Project Overview

This project is a **prototype for terrain and street procedural generation** using interactive visualization techniques. The goal is to create a system that can generate realistic street networks and terrain features through procedural algorithms, with real-time visualization capabilities for experimentation and iteration.

The project focuses on **quick iteration and experimentation** rather than production-ready code, maintaining a minimal framework approach to enable rapid prototyping of different generation algorithms.

## Main Structure

### Build System
- **Rsbuild**: Modern build tool for fast development and production builds
- **Multi-page Application (MPA)**: Each experiment is a separate entry point
- **TypeScript**: Full TypeScript support with proper type definitions
- **GLSL Support**: Custom shader compilation for WebGL-based visualizations

### Core Modules

#### 1. **IBFV (Image-Based Flow Visualization)** - `/src/IBFV/`
- **Purpose**: Real-time visualization of vector fields using GPU shaders
- **Key Files**:
  - `ibfv.ts`: Core IBFV class with WebGL shader implementation
  - `example.ts`: Interactive playground with parameter controls
  - `VectorField.d.ts`: Type definitions for vector field data structures
- **Features**:
  - GPU-accelerated flow visualization
  - Real-time parameter adjustment (noise resolution, flow intensity)
  - Interactive playground interface with clean UI
  - Support for custom vector field patterns

#### 2. **Streamlines** - `/src/streamlines/`
- **Purpose**: Mathematical computation of streamline patterns from vector fields
- **Key Files**:
  - `Streamlines.ts`: Main streamline computation engine
  - `StreamlineIntegrator.ts`: Individual streamline integration logic
  - `LookupGrid.ts`: Spatial acceleration structure for collision detection
  - `rk4.ts`: Runge-Kutta 4th order numerical integration
  - `Config.d.ts`: Configuration interface for streamline parameters
- **Features**:
  - Asynchronous computation to prevent UI blocking
  - Configurable separation distances and integration parameters
  - Support for custom vector field functions
  - Bounding box constraints and seed point management

#### 3. **Terrain Generation** - `/src/TerrainGeneration/`
- **Purpose**: Procedural terrain generation algorithms
- **Current Status**: Early stage with basic Poisson disk sampling
- **Key Files**:
  - `index.ts`: Terrain generation experiments using geometric libraries
- **Dependencies**:
  - `@flatten-js/core`: 2D geometry operations
  - `poisson-disk-sampling`: Point distribution algorithms

#### 4. **Observable Integration** - `/src/Observable/`
- **Purpose**: Data visualization and analysis using Observable Plot
- **Key Files**:
  - `index.ts`: Plot-based visualization examples
- **Features**:
  - Integration with Observable Plot for data visualization
  - Lit framework for reactive UI components

#### 5. **Terrain (Legacy)** - `/src/terrain/`
- **Purpose**: Legacy terrain-related code (JavaScript)
- **Status**: Appears to be older implementation

## Current Progress

### ✅ Completed Features

1. **IBFV Playground** (Recently Enhanced)
   - Interactive parameter controls for real-time experimentation
   - Clean, modern UI with responsive design
   - Real-time updates for noise resolution and flow parameters
   - Vector field regeneration capabilities
   - Professional styling with minimal framework approach

2. **Core Infrastructure**
   - Multi-page application setup with rsbuild
   - TypeScript configuration and type definitions
   - GLSL shader compilation support
   - WebGL-based rendering pipeline

3. **Streamline Computation Engine**
   - Complete mathematical implementation
   - Asynchronous processing for smooth UI
   - Configurable parameters and callbacks
   - Spatial optimization with lookup grids

### 🚧 In Progress

1. **Terrain Generation**
   - Basic Poisson disk sampling implementation
   - Integration with geometric libraries
   - Early stage - needs expansion

2. **Observable Visualization**
   - Basic plot integration
   - Needs connection to terrain/street data

### 📋 Planned Features

1. **Street Network Generation**
   - Integration of streamline algorithms for street patterns
   - Connection between IBFV visualization and street generation
   - Real-time street network preview

2. **Terrain-Street Integration**
   - Terrain-aware street generation
   - Elevation-based routing algorithms
   - Combined visualization of terrain and streets

3. **Interactive Controls**
   - More playground interfaces for different modules
   - Parameter presets and save/load functionality
   - Export capabilities for generated patterns

## Technical Architecture

### Dependencies
- **PixiJS**: WebGL rendering and graphics
- **@flatten-js/core**: 2D geometry operations
- **@observablehq/plot**: Data visualization
- **poisson-disk-sampling**: Point distribution algorithms
- **Lit**: Reactive UI components
- **D3**: Data manipulation utilities
- **@turf/turf**: Geospatial operations

### Development Philosophy
- **Minimal Framework**: Avoid heavy frameworks for quick iteration
- **Playground Style**: Each module has interactive examples
- **Modular Design**: Independent experiments in separate folders
- **Type Safety**: Full TypeScript coverage
- **Real-time Feedback**: Interactive parameter adjustment

## Usage

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Available Routes
- `/` - Main index with links to all experiments
- `/ibfv` - IBFV playground with interactive controls
- `/observable` - Observable Plot visualizations

## Future Directions

1. **Integration**: Connect IBFV visualization with streamline computation for street generation
2. **Terrain Enhancement**: Expand terrain generation with more sophisticated algorithms
3. **Export Pipeline**: Add capabilities to export generated patterns as usable data
4. **Performance**: Optimize for larger-scale generation and visualization
5. **Documentation**: Add more playground examples and tutorials

---

*This document serves as a comprehensive overview for both AI assistants and human developers working on the project. It should be updated as the project evolves.*
