
/*
*   Copyright (c) 2018, EPFL/Human Brain Project PCO
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

import constants.{EditorConstants, JsonLDConstants, SchemaFieldsConstants, UiConstants}

case class PreviewInstance(id: String, name:String, intanceType:String, description:Option[String])

object PreviewInstance {

  import play.api.libs.functional.syntax._
  import play.api.libs.json._

  def fromNexusInstance(nexusInstance: NexusInstance): PreviewInstance = {
    val id = NexusInstanceReference.fromUrl(nexusInstance.getField(JsonLDConstants.ID).get.as[String]).toString
    val name = nexusInstance.getField(SchemaFieldsConstants.NAME).getOrElse(JsString("")).as[String]
    val description: Option[String] = nexusInstance.getField(SchemaFieldsConstants.DESCRIPTION).map(_.as[String])
    val t = nexusInstance.getField(JsonLDConstants.TYPE ).get.as[String]
    PreviewInstance(id, name, t, description)
  }

  implicit val previewInstanceReads: Reads[PreviewInstance] = (
    (JsPath \ "id").read[String] and
      (JsPath \ "name").readNullable[String].map(_.getOrElse("")) and
      (JsPath \ UiConstants.DATATYPE).read[String] and
      (JsPath \ "description").readNullable[String]
    ) (PreviewInstance.apply _)

  implicit val previewInstanceWrites: Writes[PreviewInstance] = (
    (JsPath \ "id").write[String] and
      (JsPath \ "name").write[String] and
      (JsPath \ UiConstants.DATATYPE).write[String] and
      (JsPath \ "description").writeNullable[String]
    ) (unlift(PreviewInstance.unapply))


}
