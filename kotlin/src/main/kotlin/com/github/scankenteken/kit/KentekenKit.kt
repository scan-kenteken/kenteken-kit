package com.github.scankenteken.kit

private const val KENTEKEN_LENGTH = 6

private data class Series(val index: Int, val mask: String, val groups: IntArray)

private val SERIES_GROUPS = listOf(
  listOf("LL", "DD", "DD"),
  listOf("DD", "DD", "LL"),
  listOf("DD", "LL", "DD"),
  listOf("LL", "DD", "LL"),
  listOf("LL", "LL", "DD"),
  listOf("DD", "LL", "LL"),
  listOf("DD", "LLL", "D"),
  listOf("D", "LLL", "DD"),
  listOf("LL", "DDD", "L"),
  listOf("L", "DDD", "LL"),
  listOf("LLL", "DD", "L"),
  listOf("L", "DD", "LLL"),
  listOf("D", "LL", "DDD"),
  listOf("DDD", "LL", "D")
)

private val SERIES = SERIES_GROUPS.mapIndexed { index, groups ->
  Series(index + 1, groups.joinToString(""), groups.map { it.length }.toIntArray())
}

private val FORBIDDEN_COMBINATIONS = listOf(
  "GVD", "KKK", "NSB", "PKK", "PSV", "TBS", "SS", "SD", "PVV", "SGP", "VVD", "FVD", "BBB"
)

private val ALWAYS_DISALLOWED = setOf('C', 'Q')
private val SERIES_4_PLUS_DISALLOWED = setOf('A', 'E', 'I', 'O', 'U')

object KentekenKit {
  @JvmStatic
  fun normalize(raw: String): String = raw.uppercase().replace(Regex("[^A-Z0-9]"), "")

  @JvmStatic
  fun format(raw: String): String {
    val normalized = normalize(raw)
    if (normalized.length != KENTEKEN_LENGTH) return normalized
    return formatNormalized(normalized, findSeries(normalized))
  }

  @JvmStatic
  fun formatPartial(raw: String): String {
    val normalized = normalize(raw).take(KENTEKEN_LENGTH)
    if (normalized.isEmpty()) return ""
    if (normalized.length == KENTEKEN_LENGTH) {
      return formatNormalized(normalized, findSeries(normalized))
    }

    val candidates = SERIES.filter { matchesMaskPrefix(normalized, it.mask) }
    val candidate = candidates.firstOrNull()
    if (candidates.size == 1 && candidate != null) {
      return formatWithGroups(normalized, candidate.groups)
    }

    return formatPartialByCharacterRuns(normalized)
  }

  @JvmStatic
  fun isValid(raw: String): Boolean {
    val normalized = normalize(raw)
    if (normalized.length != KENTEKEN_LENGTH) return false
    val series = findSeries(normalized) ?: return false

    if (containsDisallowedLetter(normalized, series)) return false
    if (containsForbiddenCombination(normalized, series)) return false

    return true
  }
}

private fun findSeries(normalized: String): Series? = SERIES.firstOrNull { matchesMask(normalized, it.mask) }

private fun matchesMask(value: String, mask: String): Boolean = value.length == mask.length && matchesMaskPrefix(value, mask)

private fun matchesMaskPrefix(value: String, mask: String): Boolean =
  value.withIndex().all { (index, char) -> matchesMaskCharacter(char, mask.getOrNull(index)) }

private fun matchesMaskCharacter(char: Char, mask: Char?): Boolean = when (mask) {
  'L' -> char in 'A'..'Z'
  'D' -> char in '0'..'9'
  else -> false
}

private fun splitByGroups(value: String, groups: IntArray): List<String> {
  var offset = 0
  return groups.map { size ->
    val start = offset.coerceAtMost(value.length)
    val end = (offset + size).coerceAtMost(value.length)
    val part = if (start < end) value.substring(start, end) else ""
    offset += size
    part
  }
}

private fun formatWithGroups(value: String, groups: IntArray): String = splitByGroups(value, groups).filter { it.isNotEmpty() }.joinToString("-")

private fun formatNormalized(normalized: String, series: Series?): String {
  return if (series != null) formatWithGroups(normalized, series.groups) else formatByCharacterRuns(normalized)
}

private fun formatByCharacterRuns(value: String): String {
  val groups = Regex("[A-Z]+|\\d+").findAll(value).map { it.value }.toList()
  return if (groups.size == 3) groups.joinToString("-") else value
}

private fun formatPartialByCharacterRuns(value: String): String {
  val groups = Regex("[A-Z]+|\\d+").findAll(value).map { it.value }.toList()
  if (groups.isEmpty()) return ""

  return groups.joinToString("-") { group ->
    if (group.length <= 2) group else group.chunked(2).joinToString("-")
  }
}

private fun containsDisallowedLetter(normalized: String, series: Series): Boolean {
  val disallowed = ALWAYS_DISALLOWED.toMutableSet()
  if (series.index >= 4) disallowed.addAll(SERIES_4_PLUS_DISALLOWED)
  return normalized.any { it in disallowed }
}

private fun containsForbiddenCombination(normalized: String, series: Series): Boolean {
  val letterGroups = splitByGroups(normalized, series.groups).filter { it.all { ch -> ch in 'A'..'Z' } }
  return letterGroups.any { group -> FORBIDDEN_COMBINATIONS.any { group.contains(it) } }
}
