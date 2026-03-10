#!/bin/bash
WIN_JAR=$(wslpath -w "/home/ark/자원관리시스템/backend/target/resource-management-0.0.1-SNAPSHOT.jar")
exec "/mnt/c/MSADev_4.2/app/java/jdk-17/bin/java.exe" -jar "$WIN_JAR"
