# JVM Out of Memory Crash

**Date:** 2026-03-09
**Context:** Backend failed to start — Docker was not running, then on restart the JVM crashed due to insufficient memory.

## Error
```
There is insufficient memory for the Java Runtime Environment to continue.
Native memory allocation (mmap) failed to map 266338304 bytes. Error detail: G1 virtual space
```

## Root Causes
1. Docker was not running → Postgres unavailable → slow/failed sign-in
2. JVM defaulted to large heap allocation that exceeded available RAM

## Fix Applied
Started backend with reduced heap:
```
mvn spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.jvmArguments="-Xms256m -Xmx512m"
```

## Notes
- `application-local.properties` contains AWS S3 + Google OAuth credentials — must use `-Dspring-boot.run.profiles=local`
- `mvnw.cmd` wrapper is broken; use system `mvn` (Apache Maven 3.9.9 at `C:\tools\apache-maven-3.9.9`)
- JVM: OpenJDK 17.0.14 (Microsoft)

