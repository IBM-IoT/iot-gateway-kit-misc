# iot-gateway-kit-misc

A set of utility nodes to be used with the IBM's [IoT Gateway Kit](https://github.com/IBM-IoT/iot-gateway-kit).

### Installation

It is recommended to use these nodes with the [gateway kit](https://github.com/IBM-IoT/iot-gateway-kit). However, if you want to install these separately, the package is available on npm. Simply run:
```
npm install iot-gateway-kit-misc
```

### Nodes

This package currently contains four nodes.

##### Anomaly detection node

This node can be used to detect very simple anomalies in a numerical data stream, and generate alerts when these anomalies are detected. Currently, this node can detect anomalies based on min/max thresholds and/or percent deviation from a rolling average.

##### Batcher node

This node is design to batch any messages flowing through it, and only output a batch when a configurable threshold is met.

##### Flow Sensor

This node simply measures the amount of messages going through itself per second.

##### Timeseries Generator

This node is designed to generate large volumes of timeseries data used mainly for stress testing.
