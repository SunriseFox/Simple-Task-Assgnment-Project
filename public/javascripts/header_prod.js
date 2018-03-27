function toggle_menu () {
  $('#right_side').toggleClass('large screen only')
  $('#left_side').toggleClass('large screen only')
}
function reset_menu () {
  $('#right_side').removeClass('large screen only')
  $('#left_side').addClass('large screen only')
}
function reload_task_table () {
  $.get({
    url: '/admin/task.json',
    success: function (data) {
      var tbody = ''
      const records = data.records
      $.each(records, function (k, v) {
        tbody += '<tr>' +
          '<td>' + v.task_id + '</td>' +
          '<td data-tooltip="'+ v.description +'" data-position="right center"><a onclick=\'loadView(this,"/tasks/'+ v.task_id +'")\'">' + v.title + '</a></td>' +
          '<td>' + (v.stored_name ? '<a href="/files/' + v.stored_name + '"><i class="download icon"></i>'+v.origin_file+'</a>' : '-') + '</td>' +
          '<td class="' + ( v.active ? 'positive' : '' ) + '">' + new Date(v.start).toLocaleString() + ' ~ <br/>' + new Date(v.end).toLocaleString() + '</td>' +
          '<td>' + [v.downloaded || '-' , v.accepted , v.submitted , v.approved].join(' / ') + '</td>' +
          '<td><a onclick="delete_task('+v.task_id+')"><i class="delete icon"></i></a></td>' +
          '</tr>'
      })
      $('#task_table tbody').html(tbody)
    }
  })
}
function delete_task(i) {
  showConfirmModal("要删除 "+ i +" 吗？", {
    url: "/admin/task/delete/"+i,
    success: function (data) {
      if(data.success) {
        reload_task_table()
      } else showFailedModal('将删除与该任务相关的<span class="red">所有</span>记录，请务必点击<a target="_blank" href="/admin/task/delete/'+ i +'/force">这里</a>再次确认')
    }
  })
}
function init_admin_task_form () {
  $('#admin_task_form').submit(function (e) {
    e.preventDefault()
    var form = $(this)
    var button = $('.submit.button')
    button.addClass('loading')
    $('input').parent('div').removeClass('error')
    form.removeClass('error')
    var formData = new FormData(this)
    $.post({
      url: '/admin/task',
      data: formData,
      processData: false,
      contentType: false,
      success: function (data) {
        if (data.success) {
          button.removeClass('loading')
          reload_task_table()
        } else {
          var error = data.error
          var err_elem = $('#err_content')
          var err_info = ''
          Object.keys(error).forEach(function (k) {
            var elem = $('input[name=' + k + ']')
            elem.parent('div').addClass('error')
            var hint = elem.siblings('label').html() || k
            err_info += ('<div><b>' + hint + ' </b>' + error[k] + '</div>')
          })
          err_elem.html(err_info)
          form.addClass('error')
          button.removeClass('loading')
        }
      }
    })
    return false
  })
}
function reload_user_table(filter) {
  $.get({
    url: '/admin/user.json?'+filter,
    success: function (data) {
      var tbody = ''
      const records = data.records
      $.each(records, function (k, v) {
        tbody += '<tr>' +
          '<td>' + v.uid + '</td>' +
          '<td><a href="/users/' + v.student_id + '">' + v.nickname + '</a></td>' +
          '<td>' + v.student_id + '</td>' +
          '<td>' + v.realname + '</td>' +
          '<td>' + [v.uac, v.usu, v.uap, v.uab].join(' / ') + '</td>' +
          '<td><a><i class="zoom icon"></i></a></td>' +
          '</tr>'
      })
      $('#user_table tbody').html(tbody)
      $('tr').click(function () {
        loadView(this, '/users/' + $(this).children('td:nth-child(3)').text())
      })
    }
  })
}

function init_feeds () {
  $('a.like').click(function () {
    const child = $(this).children('b')
    $.get({url: '/star/'+$(this).attr('feed')+($(this).hasClass('active')?"/unstar" :"/star")})
    if($(this).hasClass('active')){
      $(this).removeClass('active')
      child.html(parseInt(child.html(),10) - 1)
    } else {
      $(this).addClass('active')
      child.html(parseInt(child.html(),10) + 1)
    }

  })
}

function init_stars () {
  $('i.like').click(function () {
    const child = $(this).siblings('b')
    $.get({url: '/star/'+$(this).attr('feed')+($(this).hasClass('red')?"/unstar" :"/star")})
    if($(this).hasClass('red')){
      $(this).removeClass('red')
      child.html(parseInt(child.html(),10) - 1)
    } else {
      $(this).addClass('red')
      child.html(parseInt(child.html(),10) + 1)
    }
  })
}
function approveSubmit (i, j) {
  showConfirmModal('要将提交 ' + i + ' 标记为完成吗？<br/> （用户无法修改已经完成的提交）', {
    url: '/tasks/'+ i +'/approve/' + j,
    success: function (data) {
      if (data.success)
        history.go(0)
      else showFailedModal('失败了')
    }
  })
}

function showModal(which, where, clear) {
  $('.ui.modal').modal('hide');
  if (clear) $('body .modals').remove();
  reset_menu()
  $(which).addClass('loading');
  $.ajax(where).always(function (result) {
    $(which).removeClass('loading');
    if(which !== null)history.pushState({path: where, type: 'modal'}, "", where);
    $('#modal-wrapper').html(result);
    $('.ui.modal').modal('show');
  });
}

function loadView (which, where) {
  $('#main_dimmer').addClass('active')
  $('#main_menu>a.active').removeClass('active')
  reset_menu()
  $(which).addClass('active')
  $.ajax(where).always(function (result) {
    $('#main_view').html(result)
    if(which !== null)history.pushState({path: where, type: 'view'}, "", where);
    $('#main_dimmer').removeClass('active')
  })
}

function loadModalFromData(data, clear) {
  if (clear) $('body .modals').remove();
  $('#modal-wrapper').html(data);
}

function initialModalAndSow(which, json) {
  which.modal(json);
  which.modal('show');
}

function showSuccessModal(text) {
  loadModalFromData(
    '<div class="ui basic modal" id="success_info">' +
    '<div class="ui icon header"><i class="teal checkmark icon"></i>成功！</div>' +
    '<div style="text-align: center;font-size: 1.2rem"><p>'+text+'</p></div>' +
    '<div class="actions"><div class="ui green ok button">好的</div></div>' +
    '</div>');
  initialModalAndSow($('#success_info'), {inverted: true});
}
function showFailedModal(text) {
  loadModalFromData(
    '<div class="ui basic modal" id="failed_info">' +
    '<div class="ui icon header"><i class="red remove icon"></i>操作失败</div>' +
    '<div style="text-align: center;font-size: 1.2rem"><p>'+text+'</p></div>' +
    '<div class="actions"><div class="ui red ok button">好的</div></div>' +
    '</div>');
  initialModalAndSow($('#failed_info'), {inverted: true});
}

function showConfirmModal(text, ajax) {
  loadModalFromData(
    '<div class="ui basic modal" id="question">' +
    '<div class="ui icon header"><i class="teal question circular icon"></i>您确定</div>' +
    '<div style="text-align: center;font-size: 1.2rem"><p>'+text+'</p></div>' +
    '<div class="actions"><div class="ui red deny button">取消</div><div class="ui blue ok button">好的</div></div>' +
    '</div>');
  initialModalAndSow($('#question'), {
    inverted: true,
    onApprove:function () {
      if(ajax.url)
        $.ajax(ajax);
      else
        ajax.submit();
    }});
  return false;
}

function hide_banner () {
  localStorage.setItem('hide_banner', 'true');
  $('#banner').remove()
}
