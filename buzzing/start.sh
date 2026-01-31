#!/bin/bash
pm2 start --name "bun" bun -- run dev
pm2 start --name "convex" npx -- convex dev
