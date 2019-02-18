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
package controllers

import actions.EditorUserAction
import com.google.inject.Inject
import constants.{EditorConstants, SchemaFieldsConstants, SuggestionStatus}
import models.{AuthenticatedUserAction, EditorResponseObject}
import models.errors.APIEditorError
import models.instance.NexusInstanceReference
import play.api.libs.json.{JsObject, Json}
import play.api.mvc.{AbstractController, Action, AnyContent, ControllerComponents}
import services._
import services.instance.InstanceApiService
import services.specification.FormService
import services.review.ReviewService
import services.review.ReviewService.UserID

import scala.concurrent.{ExecutionContext, Future}

class ReviewController @Inject()(
  cc: ControllerComponents,
  IDMAPIService: IDMAPIService,
  suggestionService: ReviewService,
  authenticatedUserAction: AuthenticatedUserAction,
  formService: FormService,
  editorUserService: EditorUserService,
  editorService: EditorService,
  reverseLinkService: ReverseLinkService
)(
  implicit executionContext: ExecutionContext,
) extends AbstractController(cc) {

  object instanceApiService extends InstanceApiService

  def getUsers(size: Int, from: Int, search: String): Action[AnyContent] = authenticatedUserAction.async {
    implicit request =>
      IDMAPIService.getUsers(size, from, search, request.userToken).map {
        case Right((users, pagination)) => Ok(Json.obj("users" -> users, "page" -> pagination))
        case Left(res)                  => APIEditorError(res.status, res.body).toResult
      }
  }

  def getUserById(id: String): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    IDMAPIService.getUserInfoFromID(id, request.userToken).map {
      case Some(user) => Ok(Json.toJson(user))
      case None       => NotFound("User not found")
    }
  }

  def addUsers(org: String, domain: String, schema: String, version: String, instanceId: String): Action[AnyContent] =
    (authenticatedUserAction andThen EditorUserAction.editorUserAction(editorUserService)).async { implicit request =>
      val ref = NexusInstanceReference(org, domain, schema, version, instanceId)
      request.request.body.asJson match {
        case Some(users) if users.asOpt[List[UserID]].isDefined =>
          suggestionService.addUsersToInstance(ref, users.as[List[UserID]], request.userToken, request.editorUser).map {
            case Right(()) => Ok("Users added to suggestion instance")
            case Left(err) => err.toResult
          }
        case _ => Future(BadRequest("Empty content"))
      }

    }

  def acceptSuggestion(
    suggestionOrg: String,
    suggestionDomain: String,
    suggestionSchema: String,
    suggestionVersion: String,
    suggestionId: String
  ): Action[AnyContent] =
    (authenticatedUserAction andThen EditorUserAction.editorUserAction(editorUserService) andThen EditorUserAction
      .curatorUserAction(suggestionOrg))
      .async { implicit request =>
        val suggestionRef =
          NexusInstanceReference(suggestionOrg, suggestionDomain, suggestionSchema, suggestionVersion, suggestionId)
        suggestionService
          .acceptSuggestion(suggestionRef, request.body.asJson, request.editorUser.nexusUser, request.userToken)
          .map {
            case Right(()) => Ok("Suggestion created")
            case Left(err) => err.toResult
          }
      }

  def rejectSuggestion(
    org: String,
    domain: String,
    schema: String,
    version: String,
    suggestionId: String
  ): Action[AnyContent] =
    (authenticatedUserAction andThen EditorUserAction.editorUserAction(editorUserService) andThen EditorUserAction
      .curatorUserAction(org)).async { implicit request =>
      val ref = NexusInstanceReference(org, domain, schema, version, suggestionId)
      suggestionService.rejectSuggestion(ref, request.userToken).map {
        case Right(()) => Ok("Suggestion rejected")
        case Left(err) => err.toResult
      }
    }

  def getUsersSuggestions(status: String): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val s = SuggestionStatus.fromString(status)
    suggestionService.getUsersSuggestions(s, request.userToken).map {
      case Right(l) =>
        val res = for {
          i <- l
          suggestionOf = NexusInstanceReference
            .fromUrl((i.content \ SchemaFieldsConstants.SUGGESTION_OF \ SchemaFieldsConstants.RELATIVEURL).as[String])
        } yield
          FormService.getFormStructure(i.ref.nexusPath, i.content, formService.formRegistry).as[JsObject] ++ Json
            .obj("suggestionOf" -> suggestionOf)
        Ok(Json.toJson(EditorResponseObject(Json.toJson(res))))
      case Left(err) => err.toResult
    }
  }

  def getInstanceSuggestions(
    org: String,
    domain: String,
    schema: String,
    version: String,
    instanceId: String
  ): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val ref = NexusInstanceReference(org, domain, schema, version, instanceId)
    suggestionService.getInstanceSuggestions(ref, request.userToken).map {
      case Right(l) =>
        val res = for {
          i <- l
        } yield FormService.getFormStructure(i.ref.nexusPath, i.content, formService.formRegistry)
        Ok(Json.toJson(EditorResponseObject(Json.toJson(res))))
      case Left(err) => err.toResult
    }
  }
}
