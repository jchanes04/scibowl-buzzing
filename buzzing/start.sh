#!/bin/bash
pm2 delete bun
pm2 delete convex
pm2 start --name "bun" bun -- run dev
pm2 start --name "convex" npx -- convex dev
