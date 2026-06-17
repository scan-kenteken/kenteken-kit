plugins {
  kotlin("jvm") version "2.0.21"
  kotlin("plugin.serialization") version "2.0.21"
  `maven-publish`
  signing
}

group = "io.github.scan-kenteken"
version = file("../VERSION").readText().trim()

repositories {
  mavenCentral()
}

kotlin {
  jvmToolchain(17)
}

dependencies {
  testImplementation(kotlin("test"))
  testImplementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

tasks.test {
  useJUnitPlatform()
}

tasks.register("printVersion") {
  doLast {
    println(version)
  }
}

java {
  withSourcesJar()
  withJavadocJar()
}

publishing {
  publications {
    create<MavenPublication>("mavenJava") {
      from(components["java"])
      artifactId = "kenteken-kit"
      pom {
        name.set("kenteken-kit")
        description.set("Dutch kenteken normalize/format/isValid/formatPartial utilities for Kotlin")
        url.set("https://github.com/scan-kenteken/kenteken-kit")
        developers {
          developer {
            id.set("scan-kenteken")
            name.set("Scan Kenteken")
          }
        }
        licenses {
          license {
            name.set("MIT")
            url.set("https://opensource.org/license/mit")
          }
        }
        scm {
          connection.set("scm:git:git://github.com/scan-kenteken/kenteken-kit.git")
          developerConnection.set("scm:git:ssh://github.com/scan-kenteken/kenteken-kit.git")
          url.set("https://github.com/scan-kenteken/kenteken-kit")
        }
      }
    }
  }

  repositories {
    maven {
      val publishToMavenCentral = providers.gradleProperty("publishToMavenCentral").orNull == "true"
      if (publishToMavenCentral) {
        name = "CentralPortalStagingApi"
        // OSSRH EOL (2025-06-30). Gradle maven-publish uses the Portal compatibility endpoint:
        // https://central.sonatype.org/publish/publish-portal-ossrh-staging-api/
        val releasesRepo =
          "https://ossrh-staging-api.central.sonatype.com/service/local/staging/deploy/maven2/"
        val snapshotsRepo = "https://central.sonatype.com/repository/maven-snapshots/"
        url = uri(if (version.toString().endsWith("SNAPSHOT")) snapshotsRepo else releasesRepo)
        credentials {
          username = providers.gradleProperty("centralPortalUsername").orNull
            ?: System.getenv("CENTRAL_PORTAL_USERNAME")
          password = providers.gradleProperty("centralPortalPassword").orNull
            ?: System.getenv("CENTRAL_PORTAL_PASSWORD")
        }
      } else {
        name = "LocalBuildRepo"
        url = uri(layout.buildDirectory.dir("repo"))
      }
    }
  }
}

signing {
  val signingKey = providers.gradleProperty("signingKey").orNull ?: System.getenv("SIGNING_KEY")
  val signingPassword = providers.gradleProperty("signingPassword").orNull ?: System.getenv("SIGNING_PASSWORD")
  val publishToMavenCentral = providers.gradleProperty("publishToMavenCentral").orNull == "true"

  if (!signingKey.isNullOrBlank()) {
    useInMemoryPgpKeys(signingKey, signingPassword.orEmpty())
    sign(publishing.publications)
  } else if (publishToMavenCentral) {
    useGpgCmd()
    sign(publishing.publications)
  }
}
