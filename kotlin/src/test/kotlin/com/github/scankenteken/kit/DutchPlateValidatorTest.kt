package com.github.scankenteken.kit

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlin.io.path.Path
import kotlin.io.path.readText
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFalse

@Serializable
private data class Fixtures(
  val valid: List<ValidFixture>,
  val partial: List<PartialFixture>,
  val invalid: List<InvalidFixture>,
  val forbidden: List<ForbiddenFixture>
)

@Serializable
private data class ValidFixture(val raw: String, val formatted: String, val series: Int)

@Serializable
private data class PartialFixture(val raw: String, val formatted: String)

@Serializable
private data class InvalidFixture(val raw: String, val codes: List<String>)

@Serializable
private data class ForbiddenFixture(val combination: String, val plate: String)

class DutchPlateValidatorTest {
  private val fixtures: Fixtures by lazy {
    val text = Path("..", "fixtures", "plates.shared.json").readText()
    Json.decodeFromString<Fixtures>(text)
  }

  @Test
  fun `normalize strips separators and uppercases`() {
    assertEquals("KJR50S", KentekenKit.normalize(" kjr-50.s "))
  }

  @Test
  fun `format matches fixture examples`() {
    fixtures.valid.forEach { example ->
      assertEquals(example.formatted, KentekenKit.format(example.raw), "Unexpected format for ${example.raw}")
    }
  }

  @Test
  fun `formatPartial matches fixture examples`() {
    fixtures.partial.forEach { example ->
      assertEquals(example.formatted, KentekenKit.formatPartial(example.raw), "Unexpected partial format for ${example.raw}")
    }
  }

  @Test
  fun `isValid accepts fixture valid examples`() {
    fixtures.valid.forEach { example ->
      assertTrue(KentekenKit.isValid(example.raw), "Expected valid plate: ${example.raw}")
    }
  }

  @Test
  fun `isValid rejects fixture invalid examples`() {
    fixtures.invalid.forEach { example ->
      assertFalse(KentekenKit.isValid(example.raw), "Expected invalid plate: ${example.raw} (${example.codes})")
    }
  }

  @Test
  fun `isValid rejects forbidden combinations including SS1212`() {
    fixtures.forbidden.forEach { example ->
      assertFalse(
        KentekenKit.isValid(example.plate),
        "Expected forbidden combination ${example.combination} to be rejected (${example.plate})"
      )
    }
  }
}
