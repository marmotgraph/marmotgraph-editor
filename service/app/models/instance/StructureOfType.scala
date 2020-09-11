/*
 *   Copyright (c) 2019, EPFL/Human Brain Project PCO
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package models.instance

import constants.{EditorConstants, SchemaFieldsConstants}
import helpers.InstanceHelper
import play.api.libs.json._
import play.api.libs.json.Reads._
import play.api.libs.functional.syntax._

final case class StructureOfType(
                                  name: String,
                                  label: String,
                                  color: Option[String],
                                  labelField: Option[String],
                                  fields: Option[Map[String, StructureOfField]],
                                  promotedFields: Option[List[String]]
                                )

object StructureOfType {

  def apply(
             name: String,
             label: String,
             color: Option[String],
             labelField: Option[String],
             fields: Option[Map[String, StructureOfField]]
           ): StructureOfType = {
    StructureOfType(name, label, color, labelField, fields, InstanceHelper.getPromotedFields(fields, labelField))


  }

  import models.instance.StructureOfField._

  val valuesToRemove = List(
    "@id",
    "@type",
    s"${SchemaFieldsConstants.IDENTIFIER}",
    s"${EditorConstants.VOCAB_ALTERNATIVES}",
    s"${EditorConstants.VOCAB_USER}",
    s"${EditorConstants.VOCAB_SPACES}",
    s"${EditorConstants.VOCAB_PROPERTY_UPDATES}"
  )

  implicit val structureOfTypeReads: Reads[StructureOfType] = (
    (JsPath \ SchemaFieldsConstants.IDENTIFIER).read[String] and
      (JsPath \ SchemaFieldsConstants.NAME).read[String] and
      (JsPath \ EditorConstants.VOCAB_COLOR).readNullable[String] and
      (JsPath \ EditorConstants.VOCAB_LABEL_PROPERTY).readNullable[String] and
      (JsPath \ EditorConstants.VOCAB_PROPERTIES)
        .readNullable[List[StructureOfField]]
        .map {
          case Some(t) =>
            Some(t.filterNot { i =>
              val l = i.label match {
                case Some(_) => true
                case _ => false
              }
              if (l) {
                valuesToRemove.contains(i.fullyQualifiedName)
              } else {
                true
              }
            }
              .map(f => f.fullyQualifiedName -> f)
              .toMap)
          case _ => None
        }
    ) (StructureOfType.apply(_, _, _, _, _))

  implicit val structureOfTypeWrites = Json.writes[StructureOfType]
}
