#!/bin/bash

echo "================================"
echo "   Simple Interest Calculator"
echo "================================"

read -p "Enter Principal Amount: " principal
read -p "Enter Rate of Interest (%): " rate
read -p "Enter Time Period (years): " time

interest=$(awk "BEGIN {printf \"%.2f\", ($principal * $rate * $time) / 100}")

echo ""
echo "Principal: $principal"
echo "Rate: $rate%"
echo "Time: $time years"
echo "Simple Interest: $interest"
