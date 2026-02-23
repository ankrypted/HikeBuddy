@REM ----------------------------------------------------------------------------
@REM Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------
@IF "%__MVNW_ARG0_NAME__%"=="" (SET "MVNW_CMD_LINE_ARGS=%*")
@SET JAVA_HOME_PARENT=%JAVA_HOME:\=/%

@SET MAVEN_WRAPPER_JAR="%MAVEN_USER_HOME%\.m2\wrapper\dists\maven-wrapper.jar"
@SET DOWNLOAD_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

@IF NOT EXIST %MAVEN_WRAPPER_JAR% (
    @MKDIR "%MAVEN_USER_HOME%\.m2\wrapper" 2>NUL
    @powershell -Command "(New-Object Net.WebClient).DownloadFile('%DOWNLOAD_URL%', %MAVEN_WRAPPER_JAR%)"
)

@java -classpath %MAVEN_WRAPPER_JAR% org.apache.maven.wrapper.MavenWrapperMain %MAVEN_WRAPPER_JAR% %*
