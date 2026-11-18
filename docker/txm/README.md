# Tranxmart kkFileView container

The TXM package starts at upstream v5.0.3, commit
3b82689a676e8a7e7d3ec4cc0c74de0676b0dac9. The machine-readable record is
[upstream.json](upstream.json). The application sources are unchanged by this
packaging change.

## Build

Docker with Buildx and Compose is the only local prerequisite:

~~~sh
docker buildx build --platform linux/amd64 -f Dockerfile.txm \
  --build-arg VCS_REF="$(git rev-parse HEAD)" \
  --load -t kkfileview:txm-local .
~~~

The multi-stage recipe compiles with Maven/JDK 21, copies the executable JAR and
external configuration into an Ubuntu 24.04 runtime, and installs Java 21,
LibreOffice, Noto CJK and Liberation fonts. Windows portable Office binaries,
Git history, credentials, and build outputs are excluded from the build context.
Only linux/amd64 is supported: upstream includes architecture-specific native
dependencies. Both base images are pinned by digest.

Ubuntu packages come from the current Ubuntu repositories during the build;
this is not a claim of bit-identical rebuilds. The installed package inventory is
/usr/share/kkfileview/system-packages.txt. Deploy a tested published image by
its digest when the image-publication step is introduced.

## Run locally

~~~sh
docker run --rm -p 8012:8012 --read-only --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --tmpfs /tmp:rw,nosuid,nodev,size=256m,mode=1777 \
  --tmpfs /var/cache/kkfileview:rw,nosuid,nodev,size=512m,uid=10001,gid=10001,mode=0700 \
  -e KK_TRUST_HOST=your-file-source.example.com \
  kkfileview:txm-local
~~~

Open http://localhost:8012. The image runs as UID/GID 10001. Supply a writable
cache volume and /tmp; they hold previews, the user's home and Office profiles.
The image's health check calls /actuator/health. Spring's stdout/stderr logging
is retained. JAVA_TOOL_OPTIONS supports JVM resource tuning.

No storage hostname or credential is baked in. KK_TRUST_HOST must name the
intended source; the upstream default denies unconfigured external sources.
KK_BASE_URL, KK_SERVER_PORT, KK_CONTEXT_PATH and KK_FILE_DIR retain their upstream
environment interfaces. The health check follows port/context changes.

The [TXM properties](application.properties) are appended to the packaged
/opt/kkfileview/config/application.properties. This matters because the upstream
configuration watcher re-reads that file directly; a Spring-only override can be
lost on reload. Uploads, arbitrary HTML scripts, background addTask requests and
spreadsheet editing are disabled in this image; only aggregate health is exposed.
The cache uses the in-process JDK implementation, with one renderer replica as
the initial deployment assumption.

For custom configuration, mount a complete replacement read-only at
/opt/kkfileview/config/application.properties, keeping the required TXM defaults.
The original upstream Dockerfile and local-development configuration are unchanged.
Center's authorization and embedded-viewer gateway are a later integration step;
this container by itself is not a document permission boundary.

## Validate the package

~~~sh
docker buildx build --platform linux/amd64 -f Dockerfile.txm \
  --target java-checks .
sh docker/txm/check-container.sh
~~~

The Java target runs upstream security, URL, Office schema and PDF viewer
regressions with an explicit JUnit-5-capable Surefire version. It fails when the
selected tests do not run.
The legacy EncodingTests uses Windows-style fixture paths and starts the whole
application; it is outside this focused Java target. Unicode rendering and
Office startup are verified by the actual-container browser suite below.

The container check creates its own Compose project, runs the actual image with
a read-only root filesystem, dropped capabilities, and writable tmpfs mounts,
and verifies its UID, cache permissions and Chinese font availability. A separate
browser/fixture container uses the existing E2E lockfile and pinned Python fixture
dependencies. It owns the served PDF, DOCX, PPTX and XLSX documents.

Chromium must show actual PDF text and nonblank canvases, retain Chinese text
through Office conversion, and load the workbook's expected cells. The suite also
checks disabled uploads, rejected untrusted sources and restricted monitoring.
Screenshots, failure traces and runtime logs are written to .artifacts/txm.
The script removes only its own containers, network and volumes when it exits.

.github/workflows/txm-container.yml runs these checks on PRs and pushes to the
release/default branches. It builds locally on the runner and uploads test
evidence; it does not publish images or deploy workloads. It needs no ACR or
production credentials. Upstream's Windows production deployment job is restricted
to the upstream repository.

## Updating the baseline

Choose an upstream release, verify its commit, and update upstream.json together
with the application version, JAR path, base-image pins and CI branch selectors as
needed. Run the Java and browser checks before accepting the update. CI verifies
that the recorded upstream commit is an ancestor of the branch and agrees with
the Maven application version. Publish any later release under a new tag; keep
the source revision, image digest, package inventory and check evidence together.
