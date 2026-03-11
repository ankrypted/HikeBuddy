# AWS S3 Setup — File Upload (Avatar Storage)

A step-by-step guide for setting up AWS S3 to store user-uploaded files in a Spring Boot + Angular application.

---

## What is S3 and Why Use It?

**Amazon S3 (Simple Storage Service)** is an object storage service. Instead of saving uploaded files on your server's disk (which runs out of space and is lost on redeploy), you store them on S3. Each file gets a permanent public URL you can save in your database.

**Key concepts:**
- **Bucket** — a container for files (like a top-level folder). Globally unique name.
- **Object / Key** — a file stored in a bucket, identified by its key (e.g. `avatars/user-123/photo.jpg`)
- **Region** — the AWS data center where the bucket lives (e.g. `eu-north-1` = Stockholm)
- **IAM User** — an AWS identity with specific permissions. Your app uses this to write to S3.
- **Access Key / Secret Key** — credentials that identify the IAM user programmatically.

---

## Step 1 — Create an S3 Bucket

1. Log in to the [AWS Console](https://console.aws.amazon.com)
2. Search for **S3** in the top search bar → Open it
3. Click **Create bucket**
4. Fill in:
   - **Bucket name**: `hikebuddy-avatars` (must be globally unique across all AWS accounts)
   - **AWS Region**: choose the region closest to your users (e.g. `eu-north-1`)
   - Leave all other settings as default
5. Click **Create bucket**

> **Interview tip:** S3 bucket names must be globally unique because they appear in URLs:
> `https://<bucket>.s3.<region>.amazonaws.com/<key>`

---

## Step 2 — Allow Public Read Access on the Bucket

By default, S3 blocks all public access. Since avatar images need to be viewable by anyone (in an `<img>` tag), you must allow public reads.

### 2a — Disable Block Public Access

1. Open your bucket → **Permissions** tab
2. Click **Block public access** → **Edit**
3. **Uncheck** "Block all public access"
4. Confirm by typing `confirm` → **Save changes**

> **Why this step first?** AWS won't let you save a public bucket policy while Block Public Access is enabled — it's a safety guard to prevent accidental data exposure.

### 2b — Add a Bucket Policy for Public Read

1. Still on the **Permissions** tab → scroll to **Bucket policy** → **Edit**
2. Paste the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hikebuddy-avatars/*"
    }
  ]
}
```

3. Click **Save changes**

**What this policy does:**
- `Principal: "*"` — anyone (public internet)
- `Action: s3:GetObject` — can only **read** files, not write or delete
- `Resource: arn:aws:s3:::hikebuddy-avatars/*` — applies to every object inside the bucket

> **Interview tip:** The `/*` at the end of the ARN is important — without it the policy applies to the bucket itself, not its contents.

---

## Step 3 — Create an IAM User for Your Application

Your application needs credentials to **write** files to S3. Best practice: create a dedicated IAM user with **minimum required permissions** (principle of least privilege).

1. Search for **IAM** in the top search bar → Open it
2. Left sidebar → **Users** → **Create user**
3. **User name**: `hikebuddy-app`
4. Click **Next** (skip "Provide user access to the AWS Management Console")
5. On Permissions page: select **Attach policies directly**
6. Click **Create inline policy** (instead of attaching a managed policy)
7. Switch to **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::hikebuddy-avatars/*"
    }
  ]
}
```

8. **Policy name**: `hikebuddy-s3-policy` → **Create policy**
9. Finish creating the user

**Permissions breakdown:**
| Permission | Purpose |
|---|---|
| `s3:PutObject` | Upload new files |
| `s3:DeleteObject` | Delete old avatar when user uploads a new one |
| `s3:GetObject` | **Not needed** — public read is handled by the bucket policy |

> **Interview tip:** Never give the app user `s3:*` (all S3 actions). Limit to only what the app actually needs. This is the **principle of least privilege**.

---

## Step 4 — Create Access Keys

1. In IAM → **Users** → click `hikebuddy-app`
2. **Security credentials** tab → **Access keys** section → **Create access key**
3. Use case: **Application running outside AWS**
4. Click **Create access key**
5. **Copy both values immediately** — the secret is shown only once:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `abc123...`
6. Store them securely (password manager, not in code)

> **Security rule:** Never commit access keys to git. Never paste them in chat. If exposed, immediately go to IAM → Security credentials → deactivate + delete the key → create a new one.

---

## Step 5 — Spring Boot Integration

### 5a — Add AWS SDK Dependency (`pom.xml`)

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
    <version>2.25.60</version>
</dependency>
```

### 5b — Configuration Properties

`application.properties` (committed to git — uses safe defaults, no secrets):
```properties
aws.s3.bucket=${AWS_S3_BUCKET:hikebuddy-avatars}
aws.s3.region=${AWS_REGION:eu-north-1}
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=6MB
```

`application-local.properties` (in `.gitignore` — holds actual secrets):
```properties
aws.s3.access-key=AKIA32YGJDLD...
aws.s3.secret-key=qUmgdf1KU/Nj...
```

> **Why separate files?** `application.properties` is safe to commit (no secrets). `application-local.properties` is gitignored — it holds credentials that only exist on your machine.

### 5c — S3Client Spring Bean (`S3Config.java`)

```java
@Configuration
public class S3Config {

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.s3.access-key}")
    private String accessKey;

    @Value("${aws.s3.secret-key}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }
}
```

> **Why `StaticCredentialsProvider` instead of `DefaultCredentialsProvider`?**
> `DefaultCredentialsProvider` reads from environment variables (`AWS_ACCESS_KEY_ID`). This works in production (ECS/EC2 inject env vars automatically) but fails in development if Maven is launched as a background process that doesn't inherit your terminal's env vars. Reading from Spring properties works reliably in all cases.

### 5d — S3 Service (`S3Service.java`)

```java
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;

    public String uploadAvatar(MultipartFile file, String userId) throws IOException {
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String key = "avatars/" + userId + "/" + UUID.randomUUID() + "." + ext;

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .contentType(file.getContentType())
                        .build(),
                RequestBody.fromBytes(file.getBytes())
        );

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }
}
```

**Key design decisions:**
- `UUID.randomUUID()` in the key — prevents filename collisions and cache busting
- `userId` in the path — easy to find / delete all files for a user
- Returns the full public URL — saved directly to the `avatar_url` column in the DB

### 5e — Controller Endpoint

```java
@PostMapping(path = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Map<String, String> uploadAvatar(
        @AuthenticationPrincipal UserDetails principal,
        @RequestParam("file") MultipartFile file) {
    String url = userService.uploadAvatar(principal.getUsername(), file);
    return Map.of("avatarUrl", url);
}
```

### 5f — UserService Upload Method

```java
@Transactional
public String uploadAvatar(String email, MultipartFile file) {
    // Validate content type
    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
    }
    // Validate file size
    if (file.getSize() > 5L * 1024 * 1024) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be under 5 MB");
    }

    User user = findByEmail(email);
    String url = s3Service.uploadAvatar(file, user.getId().toString());
    user.setAvatarUrl(url);
    userRepository.save(user);
    return url;
}
```

---

## Step 6 — Angular Frontend Integration

### Service method (`profile.service.ts`)

```typescript
uploadAvatar(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`${this.base}/avatar`, form).pipe(
        tap(res => {
            this._profile.update(p => p ? { ...p, avatarUrl: res.avatarUrl } : p);
            this.authService.patchCurrentUser({ avatarUrl: res.avatarUrl });
        }),
        map(res => res.avatarUrl),
    );
}
```

### Component handler

```typescript
onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarPreviewUrl.set(URL.createObjectURL(file)); // instant local preview
    this.avatarUploading.set(true);
    this.profileService.uploadAvatar(file).subscribe({
        next: url => {
            this.avatarUrl.set(url);
            this.toastService.show('Avatar updated.', 'success');
            this.avatarUploading.set(false);
        },
        error: () => {
            this.toastService.show('Upload failed. Please try again.', 'error');
            this.avatarUploading.set(false);
        },
    });
}
```

**Important:** Do not set `Content-Type: multipart/form-data` manually on the HTTP request — Angular's `HttpClient` sets it automatically with the correct boundary when you pass a `FormData` object.

---

## Full Data Flow

```
User picks file
    → Angular creates local blob URL for instant preview
    → POST /api/v1/users/me/avatar (multipart/form-data)
        → Spring validates content-type + size
        → S3Service generates key: avatars/{userId}/{uuid}.jpg
        → AWS SDK uploads bytes to S3 bucket
        → S3 returns (no body) — URL is constructed from bucket + region + key
        → UserService saves URL to users.avatar_url in PostgreSQL
        → Controller returns { avatarUrl: "https://..." }
    → Angular updates profile signal + auth user signal with new URL
    → Avatar <img> src updates everywhere in the app
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Unable to load credentials from any of the providers` | Env vars not inherited by the process | Read credentials from Spring properties (`application-local.properties`) |
| `The AWS Access Key Id you provided does not exist` | Wrong or deleted access key | Create a new access key in IAM → Security credentials |
| `not authorized to perform: s3:PutObject` | IAM user has no permissions policy | Attach an inline policy with `s3:PutObject` + `s3:DeleteObject` on the bucket |
| `Your bucket policy changes can't be saved` | Block Public Access is still enabled | Disable Block Public Access first (bucket → Permissions → Block public access) |
| `UnsupportedClassVersionError: class file version 65.0` | IDE compiled with Java 21, Maven runs Java 17 | Always run `mvn clean spring-boot:run` to recompile fresh |

---

## Interview Q&A

**Q: Why store files on S3 instead of the server's filesystem?**
> Server disks have limited space, files are lost on redeploy, and you can't scale horizontally (multiple servers can't share a local disk). S3 is infinitely scalable, highly durable (11 nines), and files persist independently of your servers.

**Q: How do you secure file uploads?**
> Validate content-type (`image/*` only), enforce size limits, use the authenticated user's ID in the S3 key (so users can't overwrite each other's files), and give the app IAM user only `PutObject`/`DeleteObject` — never broad `s3:*` permissions.

**Q: What is the principle of least privilege?**
> An IAM entity (user, role) should have only the minimum permissions needed to do its job. Our app only uploads and deletes avatars, so it gets only `s3:PutObject` and `s3:DeleteObject` on one specific bucket. No read permissions (public bucket policy handles reads), no bucket-level permissions, no other S3 buckets.

**Q: Why is the bucket policy for public read separate from the IAM policy?**
> The bucket policy controls who can read objects from the public internet (anonymous access). The IAM policy controls what authenticated AWS identities can do. Public `s3:GetObject` via bucket policy means any browser can load the image URL — no AWS credentials needed, which is what you want for `<img>` tags.

**Q: What happens if a user uploads a new avatar — does the old file get cleaned up?**
> In this implementation, the old file remains in S3 (we only call `PutObject` for the new file). The old URL in the DB is overwritten. For production, you'd delete the old object by parsing the previous `avatar_url` to extract the key and calling `DeleteObject`. We have `s3:DeleteObject` in our policy for exactly this reason.

**Q: How would you handle this differently in production vs local dev?**
> In production (e.g. on ECS/EC2), credentials are injected automatically via IAM roles attached to the compute resource — no access keys needed. `DefaultCredentialsProvider` handles this. In local dev, we use `StaticCredentialsProvider` reading from a gitignored properties file. You could unify this with a Spring `@Profile` conditional bean.
